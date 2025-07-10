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
    </div>
  );
}