export const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    // Use generic locale format or specific
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })
}

export const formatStipend = (amount: number) => {
    if (!amount) return 'Unpaid'
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount) + '/mo'
}

export const getModeLabel = (mode: string) => {
    switch (mode) {
        case 'remote': return 'Remote'
        case 'onsite': return 'On-site'
        case 'hybrid': return 'Hybrid'
        default: return mode
    }
}
