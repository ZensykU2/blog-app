"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { api } from "~/trpc/react";

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface TagSelectorProps {
    selectedTagIds: number[];
    onChange: (tagIds: number[]) => void;
    maxTags?: number;
}

export function TagSelector({ selectedTagIds, onChange, maxTags = 5 }: TagSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { data: allTags, isLoading } = api.tag.getAll.useQuery();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredTags = query === ""
        ? allTags
        : allTags?.filter((tag) =>
            tag.name.toLowerCase().includes(query.toLowerCase())
        );

    const toggleTag = (tagId: number) => {
        if (selectedTagIds.includes(tagId)) {
            onChange(selectedTagIds.filter((id) => id !== tagId));
        } else {
            if (selectedTagIds.length >= maxTags) return;
            onChange([...selectedTagIds, tagId]);
        }
    };

    const removeTag = (tagId: number) => {
        onChange(selectedTagIds.filter((id) => id !== tagId));
    };

    const getTagName = (id: number) => {
        return allTags?.find(t => t.id === id)?.name ?? "Unknown";
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-slate-300 mb-2">
                Tags ({selectedTagIds.length}/{maxTags})
            </label>

            {/* Selected Tags Display */}
            <div className="flex flex-wrap gap-2 mb-3">
                {selectedTagIds.map(id => (
                    <span
                        key={id}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 border border-purple-500/20"
                    >
                        {getTagName(id)}
                        <button
                            onClick={() => removeTag(id)}
                            className="ml-1 rounded-full p-0.5 hover:bg-purple-500/20 text-purple-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                {selectedTagIds.length === 0 && (
                    <span className="text-sm text-slate-500 italic py-1">No tags selected</span>
                )}
            </div>

            {/* Input / Dropdown Trigger */}
            <div
                className="relative cursor-pointer"
                onClick={() => !isLoading && setIsOpen(!isOpen)}
            >
                <div className="glass-panel w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-10 text-sm leading-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-left text-slate-200">
                    <input
                        type="text"
                        className="w-full bg-transparent border-none outline-none placeholder:text-slate-500 cursor-pointer"
                        placeholder={selectedTagIds.length >= maxTags ? "Max tags reached" : "Select tags..."}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                        disabled={selectedTagIds.length >= maxTags && !isOpen}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking input
                        onFocus={() => setIsOpen(true)}
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                        <ChevronsUpDown size={20} />
                    </span>
                </div>
            </div>

            {/* Dropdown Options */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-[#0f172a] border border-white/10 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
                    {isLoading ? (
                        <div className="px-4 py-2 text-sm text-slate-400">Loading tags...</div>
                    ) : filteredTags?.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-slate-400">No tags found.</div>
                    ) : (
                        filteredTags?.map((tag) => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            const isDisabled = !isSelected && selectedTagIds.length >= maxTags;

                            return (
                                <div
                                    key={tag.id}
                                    className={`relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-sm transition-colors
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/20 hover:text-white'}
                    ${isSelected ? 'bg-purple-500/10 text-purple-300' : 'text-slate-300'}
                  `}
                                    onClick={() => !isDisabled && toggleTag(tag.id)}
                                >
                                    <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                                        {tag.name}
                                    </span>
                                    {isSelected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-400">
                                            <Check size={16} />
                                        </span>
                                    ) : null}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
