'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2, FileText } from 'lucide-react';

interface MobileMessageInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onFileSelect: (files: File[]) => void;
    attachments: File[];
    onRemoveAttachment: (index: number) => void;
    sending: boolean;
    disabled?: boolean;
    placeholder?: string;
}

export default function MobileMessageInput({
    value,
    onChange,
    onSend,
    onFileSelect,
    attachments,
    onRemoveAttachment,
    sending,
    disabled = false,
    placeholder = "Type your message..."
}: MobileMessageInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => file.size <= 15 * 1024 * 1024);
        
        if (validFiles.length !== files.length) {
            alert('Some files were too large (max 15MB)');
        }
        
        onFileSelect(validFiles);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="bg-white border-t border-gray-200">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                        {attachments.length} file{attachments.length > 1 ? 's' : ''} attached
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-white pl-3 pr-2 py-2 rounded-xl border border-gray-200 shadow-sm max-w-[180px]"
                            >
                                <div className="p-1.5 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-medium text-gray-700 truncate">
                                        {file.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {formatFileSize(file.size)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onRemoveAttachment(index)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4">
                <div className={`flex items-center gap-3 transition-all duration-200 ${
                    isFocused ? 'transform scale-[1.02]' : ''
                }`}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* Attach Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-primary hover:bg-primary/10 active:bg-primary/20 transition-all duration-200 active:scale-95"
                        disabled={sending || disabled}
                        title="Attach files"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={placeholder}
                            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-2xl resize-none transition-all outline-none max-h-[120px] min-h-[48px] ${
                                isFocused 
                                    ? 'border-primary bg-white shadow-lg shadow-primary/10' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            rows={1}
                            disabled={sending || disabled}
                        />
                        
                        {/* Character count for long messages */}
                        {value.length > 500 && (
                            <div className="absolute -top-6 right-2 text-xs text-gray-400">
                                {value.length}/2000
                            </div>
                        )}
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={onSend}
                        disabled={sending || disabled || (!value.trim() && attachments.length === 0)}
                        className={`group relative flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 transform ${
                            sending || disabled || (!value.trim() && attachments.length === 0)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed scale-90'
                                : 'bg-primary text-white hover:bg-primary-dark hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-primary/40'
                        }`}
                    >
                        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                            !(sending || disabled || (!value.trim() && attachments.length === 0))
                                ? 'group-hover:bg-white/20 group-active:bg-white/30'
                                : ''
                        }`} />
                        {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                        ) : (
                            <Send className={`w-4 h-4 relative z-10 transition-transform duration-200 ${
                                !(sending || disabled || (!value.trim() && attachments.length === 0))
                                    ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                                    : ''
                            }`} />
                        )}
                        
                        {/* Ripple effect */}
                        {!(sending || disabled || (!value.trim() && attachments.length === 0)) && (
                            <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 group-active:animate-ping bg-primary/30 transition-opacity duration-150" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}