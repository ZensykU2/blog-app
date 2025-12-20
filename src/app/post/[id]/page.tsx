import { notFound } from "next/navigation";
import { ArrowLeft, Edit2, User } from "lucide-react";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { api } from "~/trpc/server";
import { DeletePostButton } from "../../_components/DeletePostButton";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

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
    <main className="container max-w-4xl mx-auto px-4 py-12 animate-fade-in pb-32">
      <div className="mb-8">
        <Link href="/">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Feed
          </button>
        </Link>
      </div>

      <article className="glass-panel p-8 md:p-12 rounded-2xl relative overflow-hidden">
        {/* Decorative blur in background of the card */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <header className="mb-10 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {post.author?.profileImage ? (
                <img
                  src={post.author.profileImage}
                  alt={getAuthorName()}
                  className="w-10 h-10 rounded-full ring-2 ring-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/5 ring-2 ring-white/10 flex items-center justify-center">
                  <User size={20} className="text-white/40" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">
                  {getAuthorName()}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{post.createdAt.toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  {post.updatedAt && post.updatedAt > post.createdAt && (
                    <>
                      <span>•</span>
                      <span>Updated {post.updatedAt.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-3">
                <Link href={`/edit/${post.id}`}>
                  <button className="flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer border border-white/5 text-purple-300">
                    <Edit2 size={16} />
                    Edit
                  </button>
                </Link>

                <DeletePostButton
                  postId={post.id}
                  className="flex items-center gap-2 rounded-full bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-sm font-medium transition-all hover:scale-105 cursor-pointer border border-red-500/20 text-red-400"
                />
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-strong:text-white prose-code:text-purple-300 prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/10 relative z-10">
          <div className="leading-relaxed whitespace-pre-wrap font-sans text-slate-300">
            {post.content}
          </div>
        </div>
      </article>
    </main>
  );
}