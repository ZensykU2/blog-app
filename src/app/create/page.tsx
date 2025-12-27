import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

import { PostEditor } from "../../app/_components/Posts/PostEditor";

export default async function CreatePost() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-4 py-8 animate-slide-up">
      <PostEditor />
    </main>
  );
}