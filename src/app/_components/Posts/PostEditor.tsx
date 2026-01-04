"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { encodeId } from "~/lib/ids";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { BaseEditor } from "./BaseEditor";



interface PostDraft {
  title?: string;
  content?: string;
  tags?: number[];
}

export function PostEditor() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [draftId, setDraftId] = useState<number | null>(null);

  const [baseState, setBaseState] = useState({
    title: "",
    content: "",
    tags: [] as number[],
  });

  const [resetKey, setResetKey] = useState(0);

  const createPost = api.post.create.useMutation({
    onSuccess: (data) => {
      setDraftId(data.id);
      setBaseState({ title: title.trim(), content: content.trim(), tags: [...selectedTags].sort((a, b) => a - b) });
      localStorage.removeItem("post_draft_new");
      // Redirect to edit page to prevent orphaned state
      if (data.id) {
        router.push(`/edit/${encodeId(data.id)}`);
      }
    },
    onError: (error) => {
      console.error("Failed to create draft", error);
    },
  });

  const updatePost = api.post.update.useMutation({
    onSuccess: () => {
      setBaseState({ title: title.trim(), content: content.trim(), tags: [...selectedTags].sort((a, b) => a - b) });
    },
    onError: (error) => {
      console.error("Autosave failed", error);
    },
  });

  const publishPost = api.post.update.useMutation({
    onSuccess: (data) => {
      if (data?.id) router.push(`/post/${encodeId(data.id)}`);
      toast.success("Post published successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Restore from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("post_draft_new");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as PostDraft;
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (parsed.tags) setSelectedTags(parsed.tags);
        setResetKey(prev => prev + 1);
        toast.success("Restored unsaved draft");
      } catch (e) {
        console.error("Failed to parse saved draft", e);
      }
    }
  }, []);

  const [savingAction, setSavingAction] = useState<"primary" | "secondary" | null>(null);

  const handlePublish = (finalContent?: string) => {
    setSavingAction("primary");
    const currentContent = finalContent ?? content;
    if (title.trim() && currentContent.trim()) {
      const payload = {
        title: title.trim(),
        content: currentContent.trim(),
        status: "published" as const,
        tags: selectedTags,
        wordCount: currentContent.trim().split(/\s+/).length,
      };

      if (draftId) {
        publishPost.mutate({ ...payload, id: draftId }, {
          onSettled: () => { setSavingAction(null); }
        });
      } else {
        createPost.mutate(payload, {
          onSuccess: (data) => {
            router.push(`/post/${encodeId(data.id)}`);
            toast.success("Post published!");
            localStorage.removeItem("post_draft_new");
            setSavingAction(null);
          },
          onError: () => { setSavingAction(null); }
        });
      }
    } else {
      setSavingAction(null);
    }
  };

  const handleSaveDraft = (finalContent?: string) => {
    setSavingAction("secondary");
    const contentToUse = finalContent ?? content;
    if (draftId) {
      updatePost.mutate({
        id: draftId,
        title: title.trim(),
        content: contentToUse.trim(),
        tags: selectedTags,
        wordCount: contentToUse.trim().split(/\s+/).length,
      }, {
        onSuccess: () => {
          localStorage.removeItem("post_draft_new");
          toast.success("Draft saved!");
          router.push("/");
          setSavingAction(null);
        },
        onError: () => { setSavingAction(null); }
      });
    } else {
      createPost.mutate({
        title: title.trim(),
        content: contentToUse.trim(),
        status: "draft",
        tags: selectedTags,
        wordCount: contentToUse.trim().split(/\s+/).length,
      }, {
        onSuccess: () => {
          localStorage.removeItem("post_draft_new");
          toast.success("Draft created!");
          router.push("/");
          setSavingAction(null);
        },
        onError: () => { setSavingAction(null); }
      });
    }
  };

  const onDiscardDraft = () => {
    localStorage.removeItem("post_draft_new");
    router.push("/");
  };

  return (
    <BaseEditor
      title={title}
      setTitle={setTitle}
      content={content}
      setContent={setContent}
      selectedTags={selectedTags}
      setSelectedTags={setSelectedTags}
      onSave={handlePublish}
      onSecondaryAction={handleSaveDraft}
      saveButtonText="Publish Now"
      secondaryButtonText="Save as Draft"
      onBack={() => { router.push("/"); }}
      isSaving={savingAction === "primary" && (publishPost.isPending || createPost.isPending || (updatePost.isPending && !draftId))}
      isSecondaryLoading={savingAction === "secondary" && (updatePost.isPending || createPost.isPending)}
      backButtonText="Back to Feed"
      onDiscardDraft={onDiscardDraft}
      initialTitle={baseState.title}
      initialContent={baseState.content}
      initialTags={baseState.tags}
      persistenceKey="post_draft_new"
      key={resetKey}
    />
  );
}
