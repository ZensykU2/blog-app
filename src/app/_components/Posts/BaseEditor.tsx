"use client";

import type { ReactNode } from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, Save, ChevronUp, ChevronDown, Clock, Type } from "lucide-react";
import { toast } from "react-hot-toast";
import { TagSelector } from "../Shared/TagSelector";
import { MarkdownToolbar } from "../Shared/MarkdownToolbar";
import { FormattingGuide } from "../Shared/FormattingGuide";
import { MarkdownRenderer } from "../Shared/MarkdownRenderer";
import { Modal } from "../Shared/Modal";
import { insertMarkdown } from "~/lib/markdown";
import { Image as ImageIcon, Camera } from "lucide-react";
import { CropperModal } from "../Profile/CropperModal";

interface BaseEditorProps {
    title: string;
    setTitle: (t: string) => void;
    content: string;
    setContent: (c: string) => void;
    selectedTags: number[];
    setSelectedTags: (tags: number[]) => void;
    onSave: (finalContent?: string) => void;
    onBack: () => void;
    isSaving: boolean;
    saveButtonText: string;
    backButtonText: string;
    draftKey: string;
    hasLoadedDraft: boolean;
    onDiscardDraft: () => void;
    initialTitle?: string;
    initialContent?: string;
    initialTags?: number[];
}

export function BaseEditor({
    title,
    setTitle,
    content,
    setContent,
    selectedTags,
    setSelectedTags,
    onSave,
    onBack,
    isSaving,
    saveButtonText,
    backButtonText,
    draftKey,
    hasLoadedDraft,
    onDiscardDraft,
    initialTitle = "",
    initialContent = "",
    initialTags = [],
}: BaseEditorProps) {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const [isToolbarOpen, setIsToolbarOpen] = useState(true);
    const [showBackModal, setShowBackModal] = useState(false);
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const VAULT_MARKER = "<!-- IMG_VAULT -->";

    // Isolated states for fast typing
    const [localStory, setLocalStory] = useState("");
    const [localVault, setLocalVault] = useState<Record<string, string>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize from content only once
    useEffect(() => {
        if (!isInitialized && content) {
            // Robust splitting: handle both old and new markers
            let story = content.split('<!-- IMG_VAULT -->')[0] ?? content;
            story = story.split('[//]: # (IMG_VAULT)')[0] ?? story;

            const vaultPart = content.includes('<!-- IMG_VAULT -->')
                ? content.split('<!-- IMG_VAULT -->').slice(1).join('<!-- IMG_VAULT -->')
                : content.split('[//]: # (IMG_VAULT)').slice(1).join('[//]: # (IMG_VAULT)');

            const vault: Record<string, string> = {};
            // Robust extraction using regex
            const defRegex = /\[(img[a-z0-9]+)\]:\s*(data:image\/[a-zA-Z0-9]+;base64,\S+)/g;
            let match;
            while ((match = defRegex.exec(content)) !== null) {
                if (match[1] && match[2]) {
                    vault[match[1]] = match[2];
                }
            }

            setLocalStory(story.trimEnd());
            setLocalVault(vault);
            setIsInitialized(true);
        } else if (!isInitialized && !content) {
            setIsInitialized(true);
        }
    }, [content, isInitialized]);

    // Debounced sync to parent content (Heavy - higher debounce to prevent lag)
    useEffect(() => {
        if (!isInitialized) return;

        const timeout = setTimeout(() => {
            // Find which images are actually in the text
            const usedRefs = (localStory.match(/\[img[a-z0-9]+\]/g) || [])
                .map(r => r.replace(/[\[\]]/g, "")) as string[];

            const definitions: string[] = [];
            const newVault: Record<string, string> = {};

            Object.entries(localVault).forEach(([id, data]) => {
                if (usedRefs.includes(id)) {
                    definitions.push(`[${id}]: ${data}`);
                    newVault[id] = data;
                }
            });

            // Update local vault only if images were purged
            if (Object.keys(newVault).length < Object.keys(localVault).length) {
                setLocalVault(newVault);
            }

            const storyPart = localStory.trim();
            const finalContent = definitions.length > 0
                ? `${storyPart}\n\n${VAULT_MARKER}\n\n${definitions.join("\n\n")}`
                : storyPart;

            if (finalContent !== content) {
                setContent(finalContent);
            }
        }, 2500); // 2.5s debounce for background syncing

        return () => clearTimeout(timeout);
    }, [localStory, localVault, isInitialized, setContent, content, VAULT_MARKER]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalStory(e.target.value);
    };

    const { wordCount, readingTime } = useMemo(() => {
        const words = localStory.trim() ? localStory.trim().split(/\s+/).length : 0;
        return {
            wordCount: words,
            readingTime: Math.ceil(words / 200)
        };
    }, [localStory]);

    const handleBackPress = () => {
        const isDirty =
            title !== initialTitle ||
            content !== initialContent ||
            JSON.stringify([...selectedTags].sort()) !== JSON.stringify([...initialTags].sort());

        if (isDirty && (title.trim() || content.trim() || selectedTags.length > 0)) {
            setShowBackModal(true);
        } else {
            onBack();
        }
    };

    const handleSaveAndLeave = () => {
        toast.success("Draft saved!");
        onBack();
    };

    const handleDiscardAndLeave = () => {
        onDiscardDraft();
        onBack();
    };

    const handleMarkdownInsert = (syntax: string, type: 'wrap' | 'block' | 'link' | 'image' = 'wrap') => {
        if (!textareaRef.current) return;

        if (type === 'image') {
            fileInputRef.current?.click();
            return;
        }

        const { newText, newCursorPos } = insertMarkdown(textareaRef.current, syntax, type);
        setLocalStory(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setCroppingImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedImage: string) => {
        const id = `img${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
        const refTag = `![Image][${id}]`;

        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const before = localStory.substring(0, start);
        const after = localStory.substring(end);

        const newStory = `${before}${refTag}${after}`;

        setLocalVault(prev => ({ ...prev, [id]: croppedImage }));
        setLocalStory(newStory);
        setCroppingImage(null);
        toast.success("Image cropped and embedded!");
    };

    const onPaste = (e: React.ClipboardEvent) => {
        const item = e.clipboardData.items[0];
        if (item?.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
                e.preventDefault();
                handleImageUpload(file);
            }
        }
    };

    return (
        <div className="pb-20 relative">
            <div className="w-full max-w-[1920px] mx-auto px-4 xl:px-12 grid grid-cols-1 xl:grid-cols-[280px_800px_minmax(500px,1fr)] justify-center gap-x-12 items-start">

                {/* Header Section */}
                <div className="col-span-1 xl:col-span-2 flex items-center justify-between py-8">
                    <button
                        onClick={handleBackPress}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group w-fit"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        {backButtonText}
                    </button>

                    <button
                        onClick={() => {
                            const usedRefs = (localStory.match(/\[img[a-z0-9]+\]/g) || [])
                                .map(r => r.replace(/[\[\]]/g, "")) as string[];
                            const definitions: string[] = [];
                            Object.entries(localVault).forEach(([id, data]) => {
                                if (usedRefs.includes(id)) definitions.push(`[${id}]: ${data}`);
                            });
                            const storyPart = localStory.trim();
                            const finalContent = definitions.length > 0
                                ? `${storyPart}\n\n${VAULT_MARKER}\n\n${definitions.join("\n\n")}`
                                : storyPart;

                            setContent(finalContent);
                            onSave(finalContent);
                        }}
                        disabled={isSaving || !title.trim() || !localStory.trim()}
                        className="flex items-center gap-2 bg-white text-black px-8 py-2.5 rounded-full font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-xl shadow-white/5"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} />
                                {saveButtonText}
                            </>
                        )}
                    </button>
                </div>

                <div className="hidden xl:block h-full border-l border-white/5 pl-8 py-8">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Preview</h3>
                </div>

                {/* Sidebar */}
                <div className="hidden xl:block sticky top-8 space-y-6">
                    <FormattingGuide />
                    <TagSelector selectedTagIds={selectedTags} onChange={setSelectedTags} maxTags={5} />
                    <div className="glass-panel p-4 rounded-xl space-y-3 border border-white/5">
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <Type size={16} className="text-purple-400" />
                            <span className="font-medium">{wordCount}</span> <span className="text-slate-600">words</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                            <Clock size={16} className="text-purple-400" />
                            <span className="font-medium">{readingTime}</span> <span className="text-slate-600">min read</span>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Autosaved to draft
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor Writing Area */}
                <div className="w-full xl:mx-0 min-w-0">
                    <div className="space-y-8">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent text-5xl md:text-6xl font-black placeholder-white/20 border-none outline-none resize-none tracking-tight pb-4 border-b border-transparent group-focus-within:border-white/10 transition-colors"
                                maxLength={255}
                                autoFocus={!title}
                                spellCheck={false}
                            />
                        </div>

                        <div className="xl:hidden space-y-6">
                            <div className="flex items-center gap-4 text-xs text-slate-500 justify-between px-2">
                                <div className="flex items-center gap-2"> <Type size={14} /> <span>{wordCount} words</span> </div>
                                <div className="flex items-center gap-2"> <Clock size={14} /> <span>{readingTime} min read</span> </div>
                            </div>
                            <TagSelector selectedTagIds={selectedTags} onChange={setSelectedTags} maxTags={5} />
                            <FormattingGuide />
                            <div className="flex gap-4 border-b border-white/10 pb-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('write')}
                                    className={`text-sm font-bold transition-colors cursor-pointer ${activeTab === 'write' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Write
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    className={`text-sm font-bold transition-colors cursor-pointer ${activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Preview
                                </button>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/5 bg-white/0 backdrop-blur-[2px] overflow-hidden min-h-[60vh] transition-all duration-300">
                            {activeTab === 'write' ? (
                                <>
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Formatting</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
                                            className="p-1 text-slate-500 hover:text-white transition-colors rounded hover:bg-white/10 cursor-pointer"
                                        >
                                            {isToolbarOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-300 ${isToolbarOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <MarkdownToolbar
                                            onInsert={handleMarkdownInsert}
                                            onImageClick={() => fileInputRef.current?.click()}
                                        />
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file);
                                            e.target.value = "";
                                        }}
                                    />
                                    <textarea
                                        ref={textareaRef}
                                        placeholder="Tell your story..."
                                        value={localStory}
                                        onChange={handleTextChange}
                                        onPaste={onPaste}
                                        className="w-full h-full min-h-[60vh] bg-transparent text-lg text-slate-300 placeholder-white/20 border-none outline-none resize-none leading-relaxed p-6 font-mono focus:ring-0"
                                        style={{ fontFamily: 'inherit' }}
                                        spellCheck={false}
                                    />
                                </>
                            ) : (
                                <div className="p-8 h-full min-h-[60vh] overflow-y-auto bg-black/20">
                                    <MarkdownRenderer
                                        content={localStory}
                                        extraDefinitions={localVault}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Preview */}
                <div className="hidden xl:block sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pl-8 border-l border-white/5 custom-scrollbar">
                    <div className="pt-2">
                        {localStory.trim() ? (
                            <div className="w-full">
                                <MarkdownRenderer
                                    content={localStory}
                                    extraDefinitions={localVault}
                                />
                            </div>
                        ) : (
                            <div className="text-slate-600 italic text-sm">Type to see preview...</div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showBackModal}
                onClose={() => setShowBackModal(false)}
                title="Unsaved Changes"
                description="Do you want to save your work as a draft before leaving?"
            >
                <div className="flex flex-col gap-3">
                    <button onClick={handleSaveAndLeave} className="w-full py-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold hover:bg-purple-500/20 hover:scale-[1.02] transition-all cursor-pointer">Save Draft and Leave</button>
                    <button onClick={handleDiscardAndLeave} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-all cursor-pointer">Discard Changes</button>
                    <button onClick={() => setShowBackModal(false)} className="w-full py-3 rounded-xl bg-white/5 text-slate-400 font-semibold hover:bg-white/10 transition-all cursor-pointer">Keep Editing</button>
                </div>
            </Modal>

            {croppingImage && (
                <CropperModal
                    imageSrc={croppingImage}
                    onClose={() => setCroppingImage(null)}
                    onCropComplete={handleCropComplete}
                    cropShape="rect"
                    aspect={16 / 9}
                    title="Crop Blog Image"
                    showAspectRatioSelection={true}
                />
            )}
        </div>
    );
}
