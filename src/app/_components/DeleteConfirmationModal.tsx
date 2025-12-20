"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
    title?: string;
    description?: string;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting,
    title = "Delete Post",
    description = "Are you sure you want to delete this post? This action cannot be undone."
}: DeleteConfirmationModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            document.body.style.overflow = "unset";
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted) return null;
    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className={`glass-panel relative w-full max-w-md overflow-hidden rounded-2xl p-0 shadow-2xl transition-all duration-300 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>

                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            <p className="text-sm text-slate-400 mt-1">{description}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </button>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                    <X size={20} />
                </button>
            </div>
        </div>,
        document.body
    );
}
