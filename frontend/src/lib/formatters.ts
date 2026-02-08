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

export const getSiteInitials = (name: string) => {
    if (!name) return 'AI';
    const capitals = name.match(/[A-Z]/g);
    if (capitals && capitals.length >= 2) {
        return capitals.slice(0, 2).join('');
    }
    return name.substring(0, 2).toUpperCase();
};
