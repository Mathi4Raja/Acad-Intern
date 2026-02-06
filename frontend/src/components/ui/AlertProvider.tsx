'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface AlertState {
    id: string
    message: string
    type: AlertType
    title?: string
}

interface ConfirmState {
    message: string
    title?: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel?: () => void
    type?: 'danger' | 'warning' | 'info'
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType, title?: string) => void
    showConfirm: (options: Omit<ConfirmState, 'onCancel'> & { onCancel?: () => void }) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export const useAlert = () => {
    const context = useContext(AlertContext)
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider')
    }
    return context
}

const alertConfig = {
    success: {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-500',
        titleColor: 'text-green-800',
    },
    error: {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-500',
        titleColor: 'text-red-800',
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        iconColor: 'text-amber-500',
        titleColor: 'text-amber-800',
    },
    info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-800',
    },
}

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alerts, setAlerts] = useState<AlertState[]>([])
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

    const showAlert = useCallback((message: string, type: AlertType = 'info', title?: string) => {
        const id = Date.now().toString()
        setAlerts(prev => [...prev, { id, message, type, title }])

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id))
        }, 4000)
    }, [])

    const dismissAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, [])

    const showConfirm = useCallback((options: ConfirmState) => {
        setConfirmState(options)
    }, [])

    const handleConfirm = useCallback(() => {
        if (confirmState?.onConfirm) {
            confirmState.onConfirm()
        }
        setConfirmState(null)
    }, [confirmState])

    const handleCancel = useCallback(() => {
        if (confirmState?.onCancel) {
            confirmState.onCancel()
        }
        setConfirmState(null)
    }, [confirmState])

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            {/* Alert Toasts */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                {alerts.map(alert => {
                    const config = alertConfig[alert.type]
                    const Icon = config.icon
                    return (
                        <div
                            key={alert.id}
                            className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4 animate-in slide-in-from-right-5 fade-in duration-300`}
                        >
                            <div className="flex items-start gap-3">
                                <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
                                <div className="flex-1 min-w-0">
                                    {alert.title && (
                                        <h4 className={`font-semibold text-sm ${config.titleColor}`}>{alert.title}</h4>
                                    )}
                                    <p className="text-sm text-gray-700">{alert.message}</p>
                                </div>
                                <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Confirm Modal */}
            {confirmState && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
                        onClick={handleCancel}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex items-start gap-4">
                            {confirmState.type === 'danger' ? (
                                <div className="p-2 bg-red-100 rounded-full">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                            ) : confirmState.type === 'warning' ? (
                                <div className="p-2 bg-amber-100 rounded-full">
                                    <AlertTriangle className="text-amber-600" size={24} />
                                </div>
                            ) : (
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Info className="text-blue-600" size={24} />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {confirmState.title || 'Confirm Action'}
                                </h3>
                                <p className="mt-2 text-sm text-gray-600">{confirmState.message}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {confirmState.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmState.type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : confirmState.type === 'warning'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-primary hover:bg-primary/90'
                                    }`}
                            >
                                {confirmState.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    )
}
