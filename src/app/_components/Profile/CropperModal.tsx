"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

interface CropperModalProps {
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (croppedImage: string) => Promise<void> | void;
    aspect?: number;
    title?: string;
    cropShape?: "round" | "rect";
    showAspectRatioSelection?: boolean;
}

async function getCroppedImg(
    imageSrc: string,
    pixelCrop: Area
): Promise<string> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("No 2d context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL("image/jpeg", 0.9);
}

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => { resolve(image); });
        image.addEventListener("error", () => { reject(new Error("Failed to load image")); }
        );
        image.crossOrigin = "anonymous";
        image.src = url;
    });
}

export function CropperModal({
    imageSrc,
    onClose,
    onCropComplete,
    cropShape = "round",
    aspect = 1,
    title,
    showAspectRatioSelection = false,
}: CropperModalProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [selectedAspect, setSelectedAspect] = useState<number | undefined>(aspect);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => { setMounted(false); };
    }, []);

    const onCropChange = useCallback((newCrop: Point) => {
        setCrop(newCrop);
    }, []);

    const onZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    const onCropAreaComplete = useCallback(
        (_croppedArea: Area, pixels: Area) => {
            setCroppedAreaPixels(pixels);
        },
        []
    );

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            await onCropComplete(croppedImage);
        } catch (error) {
            console.error("Error cropping image:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl mx-auto bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">
                        {title ?? (cropShape === 'round' ? 'Adjust Profile Picture' : 'Adjust Image')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative h-[400px] bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        minZoom={0.5}
                        maxZoom={3}
                        aspect={selectedAspect}
                        cropShape={cropShape}
                        showGrid={cropShape === "rect"}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaComplete}
                    />
                </div>

                {/* Aspect Ratio Selection - Only for blog posts */}
                {showAspectRatioSelection && (
                    <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                                onClick={() => { setSelectedAspect(1); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAspect === 1
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                Square
                            </button>
                            <button
                                onClick={() => { setSelectedAspect(16 / 9); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedAspect !== undefined && Math.abs(selectedAspect - 16 / 9) < 0.01
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                Landscape
                            </button>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="p-4">
                    <div className="flex items-center gap-4">
                        <ZoomOut size={18} className="text-slate-400" />
                        <input
                            type="range"
                            min={0.5}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => { setZoom(Number(e.target.value)); }}
                            className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <ZoomIn size={18} className="text-slate-400" />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="flex-1 py-3 px-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check size={18} />
                                Apply
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}