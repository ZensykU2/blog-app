import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { api } from "~/trpc/server";
import { PostEditForm } from "../../_components/PostEditForm";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const postId = parseInt(id);
  if (isNaN(postId)) {
    notFound();
  }

  const post = await api.post.getById({ id: postId });
  
  if (!post) {
    notFound();
  }

  if (post.authorId !== userId) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">
        <PostEditForm post={post} />
      </div>
    </main>
  );
}