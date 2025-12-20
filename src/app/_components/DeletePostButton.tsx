"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { api } from "~/trpc/react";

interface DeletePostButtonProps {
  postId: number;
  className?: string;
}

export function DeletePostButton({ postId, className }: DeletePostButtonProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      router.push("/");
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      deletePost.mutate({ id: postId });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deletePost.isPending}
      className={className ?? "flex items-center gap-2 w-full cursor-pointer hover:bg-red-500/10 p-2 rounded transition-colors"}
    >
      <Trash2 size={16} className={className ? "text-red-400" : "text-red-300"} />
      <span className={className ? "text-red-400" : "text-red-300"}>
        {deletePost.isPending ? "Deleting..." : "Delete"}
      </span>
    </button>
  );
}