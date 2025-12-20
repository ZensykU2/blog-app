"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/react";

interface PostEditFormProps {
  post: {
    id: number;
    title: string;
    content: string;
    status: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date | null;
    author: {
      id: string | null;
      displayName: string | null;
      username: string | null;
      profileImage: string | null;
    } | null;
  };
}

export function PostEditForm({ post }: PostEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);

  const updatePost = api.post.update.useMutation({
    onSuccess: () => {
      router.push(`/post/${post.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      updatePost.mutate({
        id: post.id,
        title: title.trim(),
        content: content.trim(),
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <Link href={`/post/${post.id}`}>
          <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Post
          </button>
        </Link>

        <button
          onClick={handleSubmit}
          disabled={updatePost.isPending || !title.trim() || !content.trim()}
          className="flex items-center gap-2 rounded-full bg-white text-slate-900 px-8 py-3 font-bold hover:bg-slate-200 transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {updatePost.isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          ) : (
            <Save size={20} />
          )}
          {updatePost.isPending ? "Updating..." : "Update Post"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="relative group">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-5xl md:text-6xl font-black placeholder-white/20 border-none outline-none resize-none tracking-tight pb-4 border-b border-transparent group-focus-within:border-white/10 transition-colors"
            maxLength={255}
          />
        </div>

        <div>
          <textarea
            placeholder="Tell your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[60vh] bg-transparent text-xl text-slate-300 placeholder-white/20 border-none outline-none resize-none leading-relaxed"
            style={{ fontFamily: 'inherit' }}
          />
        </div>
      </form>
    </div>
  );
}