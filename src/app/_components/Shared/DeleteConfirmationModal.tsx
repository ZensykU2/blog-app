"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "../Shared/Modal";
import { Button } from "../Shared/Button";

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
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={true}
        >
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
                <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isDeleting}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onClick={onConfirm}
                    isLoading={isDeleting}
                >
                    Delete
                </Button>
            </div>
        </Modal>
    );
}
