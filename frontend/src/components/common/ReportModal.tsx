import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Select } from '../ui/Select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAlert } from '../ui/AlertProvider';
import api from '@/lib/api';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    internshipId?: string;
    applicationId?: string;
    reportedUserId?: string;
    subjectPrefix?: string;
    contextSnapshot?: any;
}

export function ReportModal({
    isOpen,
    onClose,
    internshipId,
    applicationId,
    reportedUserId,
    subjectPrefix = '',
    contextSnapshot = {}
}: ReportModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subject, setSubject] = useState(subjectPrefix);
    const [body, setBody] = useState('');
    const [category, setCategory] = useState('other');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showAlert } = useAlert();

    // Portal state
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
            setSubject(subjectPrefix);
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
                setSubject('');
                setBody('');
                setFiles([]);
                setPreviews([]);
            }, 200);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen, subjectPrefix]);

    if (!mounted) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles].slice(0, 3)); // Limit to 3 screenshots

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews].slice(0, 3));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            return newPreviews.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !body) {
            showAlert('Please fill in all required fields', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('body', body);
            formData.append('category', category);

            // Enhance context with source URL
            const enrichedContext = {
                ...contextSnapshot,
                sourceUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
                sourcePath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
                timestamp: new Date().toISOString()
            };

            if (internshipId) formData.append('internshipId', internshipId);
            if (applicationId) formData.append('applicationId', applicationId);
            if (reportedUserId) formData.append('reportedUserId', reportedUserId);
            if (enrichedContext) formData.append('context', JSON.stringify(enrichedContext));

            files.forEach(file => {
                formData.append('screenshots', file);
            });

            const response = await api.post('/reports', formData);
            const data = response.data;

            if (data.success) {
                showAlert('Report submitted successfully. Our moderators will review it.', 'success');
                onClose();
            } else {
                showAlert(data.message || 'Failed to submit report', 'error');
            }
        } catch (error: any) {
            console.error('Report submission error:', error);
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again later.';
            showAlert(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500"
                onClick={onClose}
            />

            <div
                className={cn(
                    "relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 border border-gray-100 flex flex-col max-h-[90vh]",
                    isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'
                )}
            >
                <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex-shrink-0">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">Report Issue</h2>
                    <p className="text-[12px] font-bold text-gray-400">Provide details to help our team investigate.</p>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</Label>
                                <Select
                                    value={category}
                                    onChange={setCategory}
                                    options={[
                                        { value: "spam", label: "Spam / Prohibited Content" },
                                        { value: "harassment", label: "Harassment / Abuse" },
                                        { value: "scam", label: "Scam / Fraud" },
                                        { value: "inaccurate", label: "Inaccurate Details" },
                                        { value: "other", label: "Other" }
                                    ]}
                                    className="!bg-gray-50 border-gray-100 h-10"
                                    isFullWidth
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Short summary of the issue"
                                    className="h-10 rounded-xl font-bold bg-gray-50 border-gray-100 text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="body" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</Label>
                                <textarea
                                    id="body"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Describe the issue in detail..."
                                    className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Screenshots (Max 3)</Label>

                                <div className="grid grid-cols-3 gap-2.5">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-100 group">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}

                                    {previews.length < 3 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-600"
                                        >
                                            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                            <span className="text-[9px] font-black uppercase">Add</span>
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                    multiple
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="bg-gray-50 border-gray-200 rounded-xl h-11 sm:h-10 px-4 sm:px-6 text-[10px] sm:text-[11px] font-black uppercase tracking-wide sm:tracking-widest text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors shadow-sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 rounded-xl h-11 sm:h-10 px-4 sm:px-6 text-[10px] sm:text-[11px] font-black uppercase tracking-wide sm:tracking-widest text-white active:scale-95"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
