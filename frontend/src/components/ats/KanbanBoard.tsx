'use client'

import { useState } from 'react'
import { KanbanColumn } from './KanbanColumn'
import type { Applicant } from './ApplicationCard'

interface KanbanBoardProps {
    applicants: Applicant[]
    onApplicantClick?: (applicant: Applicant) => void
    onStatusChange?: (applicantId: string, newStatus: Applicant['status']) => void
}

const columns: { status: Applicant['status']; title: string; color: string }[] = [
    { status: 'pending', title: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'shortlisted', title: 'Shortlisted', color: 'bg-blue-100 text-blue-800' },
    { status: 'interviewed', title: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
    { status: 'offered', title: 'Offered', color: 'bg-green-100 text-green-800' },
    { status: 'rejected', title: 'Rejected', color: 'bg-red-100 text-red-800' }
]

export function KanbanBoard({ applicants, onApplicantClick, onStatusChange }: KanbanBoardProps) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(column => (
                <KanbanColumn
                    key={column.status}
                    title={column.title}
                    status={column.status}
                    color={column.color}
                    applicants={applicants.filter(a => a.status === column.status)}
                    onApplicantClick={onApplicantClick}
                />
            ))}
        </div>
    )
}
