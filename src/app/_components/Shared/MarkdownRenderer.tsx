"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";

interface MarkdownRendererProps {
    content: string;
    variant?: 'default' | 'sm' | 'none';
}

export function MarkdownRenderer({ content, variant = 'default' }: MarkdownRendererProps) {
    // Base styles (common)
    const baseStyles = "prose prose-invert max-w-none break-words";

    // Variant specific overrides
    const styles = {
        default: `
            prose-lg
            prose-headings:font-bold prose-headings:text-white
            prose-h1:text-4xl prose-h1:mb-6
            prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-bold
            prose-em:text-slate-200
            prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400
            prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300
            prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-300
            /* Removed prose-code coloring to allow highlight.js to work */
            prose-code:bg-slate-900/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/10 prose-pre:p-4 prose-pre:rounded-lg
            prose-img:rounded-xl prose-img:shadow-lg
        `,
        sm: `
            prose-sm
            prose-headings:font-bold prose-headings:text-slate-200
            prose-h1:text-base prose-h1:my-1
            prose-h2:text-sm prose-h2:my-1
            prose-h3:text-sm prose-h3:my-1
            prose-p:text-slate-400 prose-p:leading-normal prose-p:my-1
            prose-a:text-purple-400 prose-a:no-underline
            prose-strong:text-slate-300
            prose-ul:list-disc prose-ul:pl-4 prose-ul:my-1
            prose-ol:list-decimal prose-ol:pl-4 prose-ol:my-1
            prose-code:text-purple-300 prose-code:bg-slate-800/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:hidden
        `,
        none: "" // No formatting
    };

    return (
        <div className={`${baseStyles} ${variant !== 'none' ? styles[variant] : ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    img({ node, ...props }) {
                        if (!props.src) return null;
                        return (
                            <img
                                {...props}
                                className="rounded-xl shadow-2xl border border-white/10 max-w-full h-auto mx-auto my-8"
                                loading="lazy"
                            />
                        );
                    },
                    code({ node, className, children, ...props }) {
                        // @ts-expect-error - inline is passed by react-markdown but not typed in all versions
                        const isInline = props.inline || (!className && !String(children).includes('\n'));
                        const match = /language-(\w+)/.exec(className || '');

                        return isInline ? (
                            <code className={`${className} text-purple-300 font-bold px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5`} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className={`${className} text-slate-200`} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
