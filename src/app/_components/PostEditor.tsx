"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { encodeId } from "~/lib/ids";

import { api } from "~/trpc/react";

export function PostEditor() {
  const router = useRouter();
  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = api.post.create.useMutation({
    onSuccess: (data) => {
      void utils.post.invalidate();
      if (data?.id) {
        router.push(`/post/${encodeId(data.id)}`);
      } else {
        router.push("/");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      createPost.mutate({ title, content });
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-12">
        <Link href="/">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Feed
          </button>
        </Link>

        <button
          onClick={handleSubmit}
          disabled={createPost.isPending || !title.trim() || !content.trim()}
          className="flex items-center gap-2 rounded-full bg-white text-slate-900 px-8 py-3 font-bold hover:bg-slate-200 transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {createPost.isPending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          ) : (
            <Save size={20} />
          )}
          {createPost.isPending ? "Publishing..." : "Publish"}
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
            autoFocus
            spellCheck={false}
          />
        </div>

        <div>
          <textarea
            placeholder="Tell your story..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[60vh] bg-transparent text-xl text-slate-300 placeholder-white/20 border-none outline-none resize-none leading-relaxed"
            style={{ fontFamily: 'inherit' }}
            spellCheck={false}
          />
        </div>
      </form>
    </div>
  );
}