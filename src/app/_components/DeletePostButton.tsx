"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { api } from "~/trpc/react";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

interface DeletePostButtonProps {
  postId: number;
  className?: string;
}

export function DeletePostButton({ postId, className }: DeletePostButtonProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      router.push("/");
      setIsModalOpen(false);
    },
  });

  const handleDelete = () => {
    deletePost.mutate({ id: postId });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className ?? "flex items-center gap-2 w-full cursor-pointer hover:bg-red-500/10 p-2 rounded transition-colors"}
      >
        <Trash2 size={16} className={className ? "text-red-400" : "text-red-300"} />
        <span className={className ? "text-red-400" : "text-red-300"}>
          Delete
        </span>
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={deletePost.isPending}
      />
    </>
  );
}