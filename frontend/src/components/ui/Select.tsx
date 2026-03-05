'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectOption {
    label: string
    value: string
}

interface SelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
    label?: string
    className?: string
    placeholder?: string
    isFullWidth?: boolean
}

export function Select({
    value,
    onChange,
    options,
    label,
    className,
    placeholder,
    isFullWidth = false
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={cn("relative flex items-center gap-3", isFullWidth && "w-full sm:w-auto")} ref={dropdownRef}>
            {label && (
                <span className="text-sm text-gray-500 font-medium hidden sm:block">
                    {label}
                </span>
            )}
            <div className={cn("relative flex-1", !isFullWidth && "sm:flex-initial")}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full sm:w-48 bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all flex items-center justify-between shadow-sm hover:border-gray-300 group",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder || 'Select option'}
                    </span>
                    <Menu className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isOpen ? "rotate-180" : "rotate-90")} />
                </button>

                {isOpen && (
                    <>
                        <div className="absolute right-0 top-full mt-2 w-full sm:w-56 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value)
                                        setIsOpen(false)
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group",
                                        value === option.value
                                            ? "text-primary bg-primary/5 font-bold"
                                            : "text-gray-600 hover:bg-gray-50 font-medium"
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {value === option.value && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
