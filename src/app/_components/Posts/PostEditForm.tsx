"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, ChevronUp, ChevronDown, Clock, Type } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { encodeId } from "~/lib/ids";
import { BaseEditor } from "./BaseEditor";
import { TagSelector } from "../Shared/TagSelector";
import { MarkdownToolbar } from "../Shared/MarkdownToolbar";
import { FormattingGuide } from "../Shared/FormattingGuide";
import { MarkdownRenderer } from "../Shared/MarkdownRenderer";
import { Modal } from "../Shared/Modal";
import { insertMarkdown } from "~/lib/markdown";

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
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [selectedTags, setSelectedTags] = useState<number[]>(post.tags?.map(t => t.id) ?? []);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  const updatePost = api.post.update.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem(`post_draft_${post.id}`);
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
    const savedDraft = localStorage.getItem(`post_draft_${post.id}`);
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
      localStorage.setItem(`post_draft_${post.id}`, JSON.stringify({ title, content, tags: selectedTags }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [title, content, selectedTags, post.id, hasLoadedDraft, updatePost.isPending, updatePost.isSuccess]);

  const handleSubmit = () => {
    if (title.trim() && content.trim() && !updatePost.isPending && !updatePost.isSuccess) {
      updatePost.mutate({
        id: post.id,
        title: title.trim(),
        content: content.trim(),
        tags: selectedTags,
        wordCount: content.trim().split(/\s+/).length,
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
      onBack={() => router.push(`/post/${encodeId(post.id)}`)}
      isSaving={updatePost.isPending || updatePost.isSuccess}
      saveButtonText={updatePost.isSuccess ? "Redirecting..." : "Update"}
      backButtonText="Back to Post"
      draftKey={`post_draft_${post.id}`}
      hasLoadedDraft={hasLoadedDraft}
      onDiscardDraft={onDiscardDraft}
      initialTitle={post.title}
      initialContent={post.content}
      initialTags={post.tags?.map(t => t.id) ?? []}
    />
  );
}