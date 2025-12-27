import { redirect } from "next/navigation";
import { ArrowLeft, Edit2, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "~/server/auth";

import { api } from "~/trpc/server";
import { decodeId, encodeId } from "~/lib/ids";
import { DeletePostButton } from "../../_components/Posts/DeletePostButton";
import { CommentList } from "../../_components/comments/CommentList";
import { PostInteractions } from "../../_components/Posts/PostInteractions";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const postId = decodeId(id);

  if (postId === null) {
    redirect("/");
  }

  const post = await api.post.getById({ id: postId });

  if (!post) {
    redirect("/");
  }

  // Type assertion for additional fields returned by the router
  const postWithInteractions = post as typeof post & {
    likeCount: number;
    isLiked: boolean;
    isBookmarked: boolean;
  };

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
              <Link
                href={post.author?.username ? `/profile/${post.author.username}` : "#"}
                className="transition-transform hover:scale-110"
              >
                {(post.author?.profileImage ?? post.author?.image) ? (
                  <Image
                    src={(post.author.profileImage ?? post.author?.image)!}
                    alt={getAuthorName()}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full ring-2 ring-white/10 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 ring-2 ring-white/10 flex items-center justify-center">
                    <User size={20} className="text-white/40" />
                  </div>
                )}
              </Link>
              <div>
                <Link
                  href={post.author?.username ? `/profile/${post.author.username}` : "#"}
                  className="text-sm font-semibold text-white hover:text-purple-400 transition-colors"
                >
                  {getAuthorName()}
                </Link>
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
                <Link href={`/edit/${encodeId(post.id)}`}>
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

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              {post.tags.map(tag => (
                <span key={tag.id} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-sm font-medium hover:bg-purple-500/20 transition-colors cursor-default">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
        </header>

        <div className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-strong:text-white prose-code:text-purple-300 prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/10 relative z-10">
          <div className="leading-relaxed whitespace-pre-wrap font-sans text-slate-300 mb-12">
            {post.content}
          </div>
        </div>

        <PostInteractions
          postId={post.id}
          initialLikes={postWithInteractions.likeCount}
          isLiked={postWithInteractions.isLiked}
          isBookmarked={postWithInteractions.isBookmarked}
        />

        <CommentList postId={post.id} postAuthorId={post.authorId} />
      </article>
    </main>
  );
}