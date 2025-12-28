"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { encodeId } from "~/lib/ids";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { BaseEditor } from "./BaseEditor";

export function PostEditor() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const createPost = api.post.create.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem("post_draft_new"); // Clear draft on success
      if (data?.id) {
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
        const parsed = JSON.parse(savedDraft);
        setTitle(parsed.title || "");
        setContent(parsed.content || "");
        if (Array.isArray(parsed.tags)) setSelectedTags(parsed.tags);
        toast.success("Draft restored!");
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    setHasLoadedDraft(true);
  }, []);

  // Autosave
  useEffect(() => {
    if (!hasLoadedDraft) return;
    const timeout = setTimeout(() => {
      localStorage.setItem("post_draft_new", JSON.stringify({ title, content, tags: selectedTags }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, content, selectedTags, hasLoadedDraft]);

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      createPost.mutate({
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        wordCount: content.trim().split(/\s+/).length,
      });
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
      onBack={() => router.push("/")}
      isSaving={createPost.isPending}
      saveButtonText="Publish"
      backButtonText="Back to Feed"
      draftKey="post_draft_new"
      hasLoadedDraft={hasLoadedDraft}
      onDiscardDraft={onDiscardDraft}
      initialTitle=""
      initialContent=""
      initialTags={[]}
    />
  );
}