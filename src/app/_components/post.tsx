"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const [latestPost] = api.post.getLatest.useSuspenseQuery();

  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setTitle("");
      setContent("");
    },
  });

  return (
    <div className="w-full max-w-md">
      {latestPost ? (
        <div className="mb-4 rounded-lg bg-white/10 p-4">
          <p className="text-sm text-white/70">Latest post:</p>
          <h3 className="font-semibold text-white">{latestPost.title}</h3>
          <p className="text-sm text-white/80">{latestPost.content?.substring(0, 100)}...</p>
        </div>
      ) : (
        <p className="mb-4 text-white/70">No posts yet.</p>
      )}
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createPost.mutate({ title, content });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-full bg-white/10 px-4 py-2 text-white placeholder-white/50"
        />
        <textarea
          placeholder="Post Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/50"
          rows={3}
        />
        <button
          type="submit"
          className="rounded-full bg-purple-600 px-10 py-3 font-semibold transition hover:bg-purple-700 disabled:opacity-50"
          disabled={createPost.isPending}
        >
          {createPost.isPending ? "Creating..." : "Create Post"}
        </button>
      </form>
    </div>
  );
}