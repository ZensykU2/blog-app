import { notFound } from "next/navigation";
import { ArrowLeft, Edit2, User } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { api } from "~/trpc/server";
import { DeletePostButton } from "../../_components/DeletePostButton";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  
  const postId = parseInt(id);
  if (isNaN(postId)) {
    notFound();
  }

  const post = await api.post.getById({ id: postId });
  
  if (!post) {
    notFound();
  }

  const isOwner = userId === post.authorId;

  const getAuthorName = () => {
    if (!post.author) return "Unknown Author";
    if (post.author.displayName) return post.author.displayName;
    if (post.author.username) return `@${post.author.username}`;
    return "Unknown Author";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/70 hover:text-white transition">
              <ArrowLeft size={20} />
              Back to Feed
            </button>
          </Link>
          
          {isOwner && (
            <div className="flex items-center gap-4">
              <Link href={`/edit/${post.id}`}>
                <button className="flex items-center gap-2 rounded-full bg-purple-600/20 hover:bg-purple-600/40 px-4 py-2 font-semibold transition backdrop-blur-sm">
                  <Edit2 size={16} className="text-purple-300" />
                  <span className="text-purple-300">Edit</span>
                </button>
              </Link>

              <div className="flex items-center gap-2 rounded-full bg-red-600/20 hover:bg-red-600/40 px-4 py-2 font-semibold transition backdrop-blur-sm">
                <DeletePostButton postId={post.id} />
              </div>
            </div>
          )}
        </div>

        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {post.author?.profileImage ? (
                <img 
                  src={post.author.profileImage} 
                  alt={getAuthorName()}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={20} className="text-white/60" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {getAuthorName()}
                </p>
                <p className="text-xs text-white/60">
                  {post.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-white/60">
              {post.updatedAt && post.updatedAt > post.createdAt && (
                <span className="text-sm">
                  Updated: {post.updatedAt.toLocaleDateString()}
                </span>
              )}
            </div>
          </header>

          <div className="prose prose-invert max-w-none">
            <div className="text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}