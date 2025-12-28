"use client";

import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Heading1,
    Heading2,
    Code,
    Link as LinkIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MarkdownToolbarProps {
    onInsert: (syntax: string, type?: 'wrap' | 'block' | 'link' | 'image') => void;
    onImageClick?: () => void;
}

export function MarkdownToolbar({ onInsert, onImageClick }: MarkdownToolbarProps) {
    const tools: Array<{
        icon: LucideIcon;
        label: string;
        syntax: string;
        type: 'wrap' | 'block' | 'link' | 'image';
    }> = [
            { icon: Heading1, label: "H1", syntax: "# ", type: "block" },
            { icon: Heading2, label: "H2", syntax: "## ", type: "block" },
            { icon: Bold, label: "Bold", syntax: "**", type: "wrap" },
            { icon: Italic, label: "Italic", syntax: "*", type: "wrap" },
            { icon: List, label: "Bullet List", syntax: "- ", type: "block" },
            { icon: ListOrdered, label: "Numbered List", syntax: "1. ", type: "block" },
            { icon: Quote, label: "Quote", syntax: "> ", type: "block" },
            { icon: Code, label: "Code Block", syntax: "```\n\n```", type: "wrap" },
            { icon: LinkIcon, label: "Link", syntax: "", type: "link" },
        ];

    return (
        <div className="flex items-center gap-1 p-2 bg-white/5 border-b border-white/5 flex-wrap">
            {tools.map((tool) => (
                <button
                    key={tool.label}
                    type="button"
                    title={tool.label}
                    onClick={() => {
                        if (tool.label === "Image" && onImageClick) {
                            onImageClick();
                        } else {
                            onInsert(tool.syntax, tool.type);
                        }
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <tool.icon size={18} />
                </button>
            ))}
        </div>
    );
}
