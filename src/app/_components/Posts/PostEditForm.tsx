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
    title: string;
    content: string;
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
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [selectedTags, setSelectedTags] = useState<number[]>(post.tags?.map(t => t.id) ?? []);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const updatePost = api.post.update.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem(`post_draft_${String(post.id)}`);
      // Invalidate all feed queries to show updated images immediately
      void utils.post.getAll.invalidate();
      void utils.post.getByUser.invalidate();
      void utils.post.getById.invalidate();
      if (data?.id) {
        router.push(`/post/${encodeId(data.id)}`);
      } else {
        router.push("/");
      }
      toast.success("Post updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Load draft on mount if it exists
  useEffect(() => {
    const savedDraft = localStorage.getItem(`post_draft_${String(post.id)}`);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as PostDraft;
        if (parsed.title) setTitle(parsed.title);
        if (parsed.content) setContent(parsed.content);
        if (Array.isArray(parsed.tags)) setSelectedTags(parsed.tags);
        toast.success("Local draft restored!");
      } catch (e) {
        console.error("Failed to parse edit draft", e);
      }
    }
    setHasLoadedDraft(true);
  }, [post.id]);

  // Autosave
  useEffect(() => {
    if (!hasLoadedDraft || updatePost.isPending || updatePost.isSuccess) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(`post_draft_${String(post.id)}`, JSON.stringify({ title, content, tags: selectedTags }));
    }, 1000);
    return () => { clearTimeout(timeout); };
  }, [title, content, selectedTags, post.id, hasLoadedDraft, updatePost.isPending, updatePost.isSuccess]);

  const handleSubmit = (finalContent?: string) => {
    const contentToUse = finalContent ?? content;
    if (title.trim() && contentToUse.trim() && !updatePost.isPending && !updatePost.isSuccess) {
      updatePost.mutate({
        id: post.id,
        title: title.trim(),
        content: contentToUse.trim(),
        tags: selectedTags,
        wordCount: contentToUse.trim().split(/\s+/).length,
      });
    }
  };

  const onDiscardDraft = () => {
    localStorage.removeItem(`post_draft_${post.id}`);
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
      onBack={() => { router.push(`/post/${encodeId(post.id)}`); }}
      isSaving={updatePost.isPending || updatePost.isSuccess}
      saveButtonText={updatePost.isSuccess ? "Redirecting..." : "Update"}
      backButtonText="Back to Post"
      _draftKey={`post_draft_${String(post.id)}`}
      _hasLoadedDraft={hasLoadedDraft}
      onDiscardDraft={onDiscardDraft}
      initialTitle={post.title}
      initialContent={post.content}
      initialTags={post.tags?.map(t => t.id) ?? []}
    />
  );
}