import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

import { api } from "~/trpc/server";
import { decodeId } from "~/lib/ids";
import { PostEditForm } from "../../_components/Posts/PostEditForm";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    redirect("/");
  }

  const postId = decodeId(id);

  if (postId === null) {
    redirect("/");
  }

  const post = await api.post.getById({ id: postId });

  if (!post) {
    redirect("/");
  }

  if (post.authorId !== userId) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-4 py-8 animate-slide-up">
      <PostEditForm post={post} />
    </main>
  );
}