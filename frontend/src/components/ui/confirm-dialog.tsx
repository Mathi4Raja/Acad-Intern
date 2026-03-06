import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    cancelLabel?: string;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel'
}: ConfirmDialogProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 200); // Wait for animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-500"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={cn(
                    "relative bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 border border-gray-100",
                    isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
                )}
            >
                {/* Header Pattern */}
                <div className="px-6 pt-6 pb-4">
                    <h3 className={cn(
                        "text-[17px] font-black leading-tight tracking-tight uppercase mb-2",
                        type === 'danger' ? 'text-red-500' :
                            type === 'warning' ? 'text-orange-500' : 'text-primary'
                    )}>
                        {title}
                    </h3>
                    <p className="text-[13px] font-bold text-gray-500 leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={cn(
                            "w-full sm:w-auto px-5 py-2.5 sm:py-2 text-[10px] font-black uppercase tracking-widest text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-gray-200",
                            type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
                                type === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' :
                                    'bg-primary hover:bg-primary/90 shadow-primary/20'
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
