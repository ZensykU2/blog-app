"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { encodeId } from "~/lib/ids";
import { BaseEditor } from "./BaseEditor";

interface PostEditFormProps {
  post: {
    id: number;
    title: string | null;
    content: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    status: "draft" | "published" | "archived";
    author: {
      id: string | null;
      displayName: string | null;
      username: string | null;
      profileImage: string | null;
      image: string | null;
    } | null;
    tags?: { id: number; name: string; slug: string }[];
  };
}

interface PostDraft {
  title: string;
  content: string;
  tags: number[];
}

export function PostEditForm({ post }: PostEditFormProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [title, setTitle] = useState(post.title ?? "");
  const [content, setContent] = useState(post.content ?? "");
  const [selectedTags, setSelectedTags] = useState<number[]>(post.tags?.map(t => t.id) ?? []);

  // Clear legacy local storage drafts
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`post_draft_${post.id}`);
    }
  }, [post.id]);

  // Track initial state to handle "dirty" check correctly after saves
  const [baseState, setBaseState] = useState({
    title: post.title ?? "",
    content: post.content ?? "",
    tags: post.tags?.map(t => t.id) ?? [],
  });

  const updatePost = api.post.update.useMutation({
    onSuccess: (data) => {
      // Clear backup on success
      localStorage.removeItem(`backup_edit_${post.id}`);

      void utils.post.getAll.invalidate();
      void utils.post.getByUser.invalidate();
      void utils.post.getById.invalidate();

      if (data?.id) {
        // Update baseState so the dirty check in BaseEditor becomes false
        setBaseState({
          title: title.trim(),
          content: content.trim(),
          tags: [...selectedTags].sort((a, b) => a - b)
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });



  const [resetKey, setResetKey] = useState(0);

  // Restore backup on mount
  useEffect(() => {
    const backup = localStorage.getItem(`backup_edit_${post.id}`);
    if (backup) {
      try {
        const parsed = JSON.parse(backup) as PostDraft;
        toast((t) => (
          <span className="flex items-center gap-3">
            Unsaved changes found
            <button
              onClick={() => {
                setTitle(parsed.title);
                setContent(parsed.content);
                setSelectedTags(parsed.tags);
                setResetKey(prev => prev + 1);
                toast.dismiss(t.id);
                toast.success("Restored!");
              }}
              className="px-2 py-1 bg-purple-500 text-white text-xs rounded-lg font-bold"
            >
              Restore
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(`backup_edit_${post.id}`);
                toast.dismiss(t.id);
              }}
              className="text-slate-400 text-xs"
            >
              Ignore
            </button>
          </span>
        ), { duration: 6000 });
      } catch (e) {
        console.error("Failed to parse backup", e);
      }
    }
  }, [post.id]);

  const [savingAction, setSavingAction] = useState<"primary" | "secondary" | null>(null);

  const handlePublish = (finalContent?: string) => {
    setSavingAction("primary");
    const contentToUse = finalContent ?? content;
    if (title.trim() && contentToUse.trim()) {
      updatePost.mutate({
        id: post.id,
        title: title.trim(),
        content: contentToUse.trim(),
        status: "published",
        tags: selectedTags,
        wordCount: contentToUse.trim().split(/\s+/).length,
      }, {
        onSuccess: (data) => {
          if (data?.id) router.push(`/post/${encodeId(data.id)}`);
          toast.success("Post published!");
          setSavingAction(null);
        },
        onError: () => { setSavingAction(null); }
      });
    } else {
      setSavingAction(null);
    }
  };


  const handleSaveDraft = (finalContent?: string) => {
    setSavingAction("secondary");
    const contentToUse = finalContent ?? content;
    updatePost.mutate({
      id: post.id,
      title: title.trim(),
      content: contentToUse.trim(),
      tags: selectedTags,
      wordCount: contentToUse.trim().split(/\s+/).length,
    }, {
      onSuccess: () => {
        localStorage.removeItem(`backup_edit_${post.id}`);
        toast.success("Draft saved!");
        router.push(post.status === "draft" ? "/" : `/post/${encodeId(post.id)}`);
        setSavingAction(null);
      },
      onError: () => { setSavingAction(null); }
    });
  };

  const onDiscardDraft = () => {
    localStorage.removeItem(`backup_edit_${post.id}`);
    router.push(post.status === "draft" ? "/" : `/post/${encodeId(post.id)}`);
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
      onSecondaryAction={post.status === "draft" ? handleSaveDraft : undefined}
      saveButtonText={post.status === "draft" ? "Publish Now" : (updatePost.isSuccess ? "Saved!" : "Update Post")}
      secondaryButtonText={post.status === "draft" ? "Save as Draft" : undefined}
      onBack={() => { router.push(post.status === "draft" ? "/" : `/post/${encodeId(post.id)}`); }}
      isSaving={savingAction === "primary" && updatePost.isPending}
      isSecondaryLoading={savingAction === "secondary" && updatePost.isPending}
      backButtonText={post.status === "draft" ? "Back to Feed" : "Back to Post"}
      onDiscardDraft={onDiscardDraft}
      initialTitle={baseState.title}
      initialContent={baseState.content}
      initialTags={baseState.tags}
      persistenceKey={`backup_edit_${post.id}`}
      key={resetKey}
    />
  );
}