"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { encodeId } from "~/lib/ids";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { BaseEditor } from "./BaseEditor";

interface PostDraft {
  title: string;
  content: string;
  tags: number[];
}

export function PostEditor() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const createPost = api.post.create.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem("post_draft_new"); // Clear draft on success
      if (data.id) {
        router.push(`/post/${encodeId(data.id)}`);
      } else {
        router.push("/");
      }
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Load initial draft
  useEffect(() => {
    const savedDraft = localStorage.getItem("post_draft_new");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as PostDraft;
        setTitle(parsed.title);
        setContent(parsed.content);
        if (Array.isArray(parsed.tags)) setSelectedTags(parsed.tags);
        toast.success("Draft restored!");
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    setHasLoadedDraft(true);
  }, []);

  // Autosave - much higher debounce (5s) for heavy content
  useEffect(() => {
    if (!hasLoadedDraft || createPost.isPending || createPost.isSuccess) return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem("post_draft_new", JSON.stringify({ title, content, tags: selectedTags }));
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 5000);
    return () => { clearTimeout(timeout); };
  }, [title, content, selectedTags, hasLoadedDraft, createPost.isPending, createPost.isSuccess]);

  const handleSubmit = (finalContent?: string) => {
    const currentContent = finalContent ?? content;
    if (title.trim() && currentContent.trim() && !createPost.isPending && !createPost.isSuccess) {
      const payload = {
        title: title.trim(),
        content: currentContent.trim(),
        tags: selectedTags,
        wordCount: currentContent.trim().split(/\s+/).length,
      };
      createPost.mutate(payload);
    }
  };

  const onDiscardDraft = () => {
    localStorage.removeItem("post_draft_new");
  };

  return (
    <BaseEditor
      title={title}
      setTitle={setTitle}
      content={content}
      setContent={setContent}
      selectedTags={selectedTags}
      setSelectedTags={setSelectedTags}
      onSave={handleSubmit}
      onBack={() => { router.push("/"); }}
      isSaving={createPost.isPending || createPost.isSuccess}
      saveButtonText={createPost.isSuccess ? "Redirecting..." : "Publish"}
      backButtonText="Back to Feed"
      _draftKey="post_draft_new"
      _hasLoadedDraft={hasLoadedDraft}
      onDiscardDraft={onDiscardDraft}
      initialTitle=""
      initialContent=""
      initialTags={[]}
    />
  );
}
