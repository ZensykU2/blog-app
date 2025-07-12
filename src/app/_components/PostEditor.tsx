"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/react";

export function PostEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      router.push("/");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      createPost.mutate({ title, content });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link href="/">
          <button className="flex items-center gap-2 text-white/70 hover:text-white transition">
            <ArrowLeft size={20} />
            Back to Feed
          </button>
        </Link>
        
        <button
          onClick={handleSubmit}
          disabled={createPost.isPending || !title.trim() || !content.trim()}
          className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 transition disabled:opacity-50"
        >
          <Save size={20} />
          {createPost.isPending ? "Publishing..." : "Publish"}
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