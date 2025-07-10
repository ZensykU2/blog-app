"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/react";
import type { Post } from "~/server/db/schema";

interface PostEditFormProps {
  post: Post;
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href={`/post/${post.id}`}>
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition">
            <ArrowLeft size={20} />
            Back to Post
          </button>
        </Link>
        
        <button
          onClick={handleSubmit}
          disabled={updatePost.isPending || !title.trim() || !content.trim()}
          className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
        >
          <Save size={20} />
          {updatePost.isPending ? "Updating..." : "Update Post"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-4xl font-bold placeholder-white/50 border-none outline-none resize-none"
            maxLength={255}
          />
        </div>

        <div>
          <textarea
            placeholder="Tell your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] bg-transparent text-lg placeholder-white/50 border-none outline-none resize-none leading-relaxed"
            style={{ fontFamily: 'inherit' }}
          />
        </div>
      </form>
    </div>
  );
}