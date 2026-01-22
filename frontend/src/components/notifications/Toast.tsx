'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
}

interface ToastContextType {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts(prev => [...prev, { ...toast, id }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

const typeStyles: Record<ToastType, { bg: string; icon: typeof CheckCircle; iconColor: string }> = {
    success: { bg: 'bg-green-50 border-green-200', icon: CheckCircle, iconColor: 'text-green-500' },
    error: { bg: 'bg-red-50 border-red-200', icon: AlertCircle, iconColor: 'text-red-500' },
    info: { bg: 'bg-blue-50 border-blue-200', icon: Info, iconColor: 'text-blue-500' },
    warning: { bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-500' }
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const { bg, icon: Icon, iconColor } = typeStyles[toast.type]

    useEffect(() => {
        const duration = toast.duration || 5000
        const timer = setTimeout(onRemove, duration)
        return () => clearTimeout(timer)
    }, [toast.duration, onRemove])

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in',
                bg
            )}
        >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
            >
                <X size={16} className="text-gray-400" />
            </button>
        </div>
    )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => onRemove(toast.id)} />
            ))}
        </div>
    )
}
