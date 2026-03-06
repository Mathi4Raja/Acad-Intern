import { useState } from 'react'
import { Calendar, Clock, Link as LinkIcon, ExternalLink, X, Loader2, CheckCircle } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ScheduleInterviewModalProps {
    isOpen: boolean
    onClose: () => void
    onSchedule: (details: { date: string; time: string; meetingLink: string }) => Promise<void>
    studentName: string
    position: string
}

export function ScheduleInterviewModal({ isOpen, onClose, onSchedule, studentName, position }: ScheduleInterviewModalProps) {
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [meetingLink, setMeetingLink] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date || !time || !meetingLink) {
            setError('Please fill in all required fields')
            return
        }

        try {
            setLoading(true)
            setError(null)
            await onSchedule({ date, time, meetingLink })
            onClose()
        } catch (err) {
            setError('Failed to schedule interview. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Use createPortal to ensure modal is always on top of everything else in the DOM hierarchy
    // This solves z-index stacking context issues with sidebars/navbars
    const modalContent = (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                />

                {/* Modal Panel */}
                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Schedule Interview
                            </h3>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1 text-indigo-100 hover:bg-white/20 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-indigo-100">
                            Set up a meeting with <strong>{studentName}</strong> for <strong>{position}</strong>.
                        </p>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2 border border-red-100">
                                <X className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        max={`${new Date().getFullYear() + 2}-12-31`}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 p-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Time
                                </label>
                                <div className="relative">
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full rounded-xl border-gray-200 bg-gray-50 p-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Meeting Link
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        let startDate: Date;

                                        if (date && time) {
                                            startDate = new Date(`${date}T${time}`);
                                        } else {
                                            // Default to next hour if nothing selected
                                            startDate = new Date(now);
                                            startDate.setMinutes(startDate.getMinutes() + 30);
                                            startDate.setMinutes(0, 0, 0);
                                        }

                                        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

                                        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

                                        const startTimeStr = formatTime(startDate);
                                        const endTimeStr = formatTime(endDate);

                                        const details = `Interview for ${position} with ${studentName}`;
                                        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Interview: ' + studentName)}&dates=${startTimeStr}/${endTimeStr}&details=${encodeURIComponent(details)}&add=${encodeURIComponent(studentName)}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 transition-colors"
                                >
                                    Create Calendar Event
                                    <ExternalLink className="h-3 w-3" />
                                </button>
                            </div>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <LinkIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    className="w-full rounded-xl border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col-reverse sm:flex-row items-center sm:justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !date || !time || !meetingLink}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-indigo-200 hover:-translate-y-0.5 transform"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Confirm Schedule
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )

    // Render to body to escape any parent stacking contexts
    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body)
    }
    return null
}
