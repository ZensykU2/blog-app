"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

export function FormattingGuide() {
    const [isOpen, setIsOpen] = useState(false);

    const guides = [
        { label: "Headers", syntax: "# H1, ## H2, ### H3" },
        { label: "Bold", syntax: "**bold text**" },
        { label: "Italic", syntax: "*italic text*" },
        { label: "List", syntax: "- item 1" },
        { label: "Ordered", syntax: "1. item 1" },
        { label: "Quote", syntax: "> blockquote" },
        { label: "Code", syntax: "`inline code`" },
        { label: "Block", syntax: "```\ncode block\n```" },
        { label: "Link", syntax: "[title](url)" },
        { label: "Image", syntax: "![alt](url)" },
    ];

    return (
        <div className="glass-panel rounded-xl border border-white/5 overflow-hidden transition-all duration-300">
            <button
                type="button"
                onClick={() => { setIsOpen(!isOpen); }}
                className="w-full flex items-center justify-between p-4 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                    <Info size={16} />
                    <span>Markdown Guide</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-4 text-sm space-y-3 border-t border-white/5 bg-black/20">
                    <div className="grid grid-cols-1 gap-2">
                        {guides.map((g) => (
                            <div key={g.label} className="flex items-start justify-between group">
                                <span className="text-slate-400 font-medium group-hover:text-slate-300">{g.label}</span>
                                <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs font-mono">{g.syntax}</code>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
