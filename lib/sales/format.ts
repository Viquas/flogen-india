export function relativeTime(iso: string | null | undefined): string {
    if (!iso) return 'Never'
    const then = new Date(iso).getTime()
    if (isNaN(then)) return 'Never'
    const diff = Date.now() - then
    const sec = Math.round(diff / 1000)
    if (sec < 60) return 'just now'
    const min = Math.round(sec / 60)
    if (min < 60) return `${min}m ago`
    const hr = Math.round(min / 60)
    if (hr < 24) return `${hr}h ago`
    const day = Math.round(hr / 24)
    if (day < 30) return `${day}d ago`
    const mo = Math.round(day / 30)
    if (mo < 12) return `${mo}mo ago`
    const yr = Math.round(mo / 12)
    return `${yr}y ago`
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

/** Convert an E.164-ish phone string to a wa.me-compatible digit string. */
export function toWhatsAppDigits(raw: string): string {
    return raw.replace(/[^0-9]/g, '')
}
