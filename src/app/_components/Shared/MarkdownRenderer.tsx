"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import { Lightbox } from "./Lightbox";

interface MarkdownRendererProps {
    content: string;
    variant?: 'default' | 'sm' | 'none';
    extraDefinitions?: Record<string, string>;
}

export function MarkdownRenderer({ content, variant = 'default', extraDefinitions }: MarkdownRendererProps) {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Unified Image Resolver:
    // 1. Extract definitions from published content.
    // 2. Combine with extraDefinitions from editor.
    // 3. Swap references ![alt][id] -> ![alt](id) to keep markdown tiny.
    // 4. Resolve IDs in the custom 'img' component below.
    const { finalMarkdown, resolvedVault } = useMemo(() => {
        let processed = content;
        const vault: Record<string, string> = { ...extraDefinitions };

        // 1. Extract definitions from content: [img...]: data:...
        // We look for definitions anywhere in the text before stripping them.
        const defRegex = /\[(img[a-z0-9]+)\]:\s*(data:image\/[a-zA-Z0-9]+;base64,\S+)/g;
        let match;
        while ((match = defRegex.exec(processed)) !== null) {
            if (match[1] && match[2]) {
                vault[match[1]] = match[2];
            }
        }

        // 2. ID Swap: Convert ![alt][id] to ![alt](id)
        // This makes ReactMarkdown treat the ID as the src URL.
        // We handle optional spaces between brackets: ![alt] [id]
        processed = processed.replace(/!\[(.*?)\]\s*\[(img[a-z0-9]+)\]/g, "![$1]($2)");

        // 3. Strip technical markers and the vault block
        processed = processed.replace(/<!--\s*IMG_VAULT\s*-->[\s\S]*/g, "");
        processed = processed.replace(/\[\/\/\]:\s*#\s*\(IMG_VAULT\)[\s\S]*/g, "");

        return { finalMarkdown: processed.trimEnd(), resolvedVault: vault };
    }, [content, extraDefinitions]);

    // Base styles
    const baseStyles = "prose prose-invert max-w-none break-words";

    // Variant specific styles
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
            prose-img:hidden
        `,
        none: ""
    };

    return (
        <div className={`${baseStyles} ${variant !== 'none' ? styles[variant] : ''}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                    img({ node, ...props }) {
                        const src = props.src as string;
                        if (!src) return null;

                        // Resolve ID: If src is an ID in our vault, use the data URL.
                        const finalSrc = (resolvedVault[src])
                            ? resolvedVault[src]
                            : src;

                        return (
                            <img
                                {...props}
                                src={finalSrc}
                                className="rounded-xl shadow-2xl border border-white/10 max-w-full h-auto mx-auto my-8 cursor-pointer hover:opacity-90 transition-opacity"
                                loading="lazy"
                                onClick={() => setPreviewImage(finalSrc ?? null)}
                            />
                        );
                    },
                    code({ className, children, ...props }) {
                        const childrenString = typeof children === 'string' ? children : "";
                        const isInline = !className && !childrenString.includes('\n');

                        return isInline ? (
                            <code className={`${className ?? ""} text-purple-300 font-bold px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5`} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code className={`${className ?? ""} text-slate-200`} {...props}>
                                {children}
                            </code>
                        );
                    }
                }}
            >
                {finalMarkdown}
            </ReactMarkdown>

            <Lightbox images={previewImage ? [previewImage] : []} initialIndex={0} onClose={() => setPreviewImage(null)} />
        </div>
    );
}
