"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    description,
    showCloseButton = true,
}: ModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => { setMounted(false); };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = "hidden";
        } else {
            const timer = setTimeout(() => { setIsVisible(false); }, 300);
            document.body.style.overflow = "unset";
            return () => { clearTimeout(timer); };
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

            {/* Modal Content */}
            <div className={`glass-panel relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>

                {/* Header (optional) */}
                {(!!title || showCloseButton) && (
                    <div className="flex items-start justify-between p-6 pb-0">
                        <div>
                            {title && <h3 className="text-xl font-bold text-white leading-none">{title}</h3>}
                            {description && <p className="text-sm text-slate-400 mt-2">{description}</p>}
                        </div>
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg p-1 hover:bg-white/5"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
