"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
    const [mounted, setMounted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        setMounted(true);
        if (images.length > 0) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [images]);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    // Handle browser back button (mobile and desktop)
    useEffect(() => {
        if (images.length === 0) return;

        // Push a state when lightbox opens
        window.history.pushState({ lightboxOpen: true }, '');

        const handlePopState = () => {
            onClose();
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Clean up: go back if we're still on the lightbox state
            if (window.history.state?.lightboxOpen) {
                window.history.back();
            }
        };
    }, [images.length, onClose]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length]);

    const goToPrevious = () => {
        setDirection('right');
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setTimeout(() => setDirection(null), 300);
    };

    const goToNext = () => {
        setDirection('left');
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setTimeout(() => setDirection(null), 300);
    };

    if (images.length === 0 || !mounted || typeof document === "undefined") return null;

    const currentImage = images[currentIndex];
    const hasMultipleImages = images.length > 1;

    return createPortal(
        <div
            className="fixed inset-0 w-screen h-screen z-[999999] bg-black/95 backdrop-blur-3xl flex items-center justify-center animate-fade-in p-4 md:p-12 cursor-pointer"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
            onClick={() => onClose()}
        >
            <button
                className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-all z-[1000001] bg-white/5 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                <X size={28} />
            </button>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
                <>
                    <button
                        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-4 text-white md:text-white/50 md:hover:text-white transition-all z-[1000001] bg-black/80 md:bg-white/5 hover:bg-black/90 md:hover:bg-white/10 rounded-full border border-white/30 md:border-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-xl md:shadow-none"
                        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                    >
                        <ChevronLeft size={24} className="md:w-8 md:h-8" />
                    </button>
                    <button
                        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-4 text-white md:text-white/50 md:hover:text-white transition-all z-[1000001] bg-black/80 md:bg-white/5 hover:bg-black/90 md:hover:bg-white/10 rounded-full border border-white/30 md:border-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-xl md:shadow-none"
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    >
                        <ChevronRight size={24} className="md:w-8 md:h-8" />
                    </button>
                </>
            )}

            {/* Image Counter */}
            {hasMultipleImages && (
                <div className="absolute top-6 left-6 px-4 py-2 text-white/70 text-sm font-medium z-[1000001] bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            <div
                className="relative w-full h-full max-w-[95vw] max-h-[90vh] flex items-center justify-center pointer-events-none overflow-hidden"
            >
                <div
                    className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${direction === 'left' ? 'animate-slide-left' :
                        direction === 'right' ? 'animate-slide-right' :
                            ''
                        }`}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <Image
                            key={currentIndex}
                            src={currentImage!}
                            alt={`Image ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                            sizes="95vw"
                            unoptimized={currentImage?.startsWith('data:')}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
