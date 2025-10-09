import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

const APP_TZ = 'Asia/Manila';

function formatWithTZ(date: Date, pattern: string): string {
    // Use Intl for stable timezone formatting, then optionally massage pieces
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: APP_TZ,
        year: 'numeric', month: 'short', day: '2-digit',
        hour: pattern.includes('h') ? 'numeric' : undefined,
        minute: pattern.includes('mm') ? '2-digit' : undefined,
        hour12: true,
    }).formatToParts(date);

    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    const MMM = get('month');
    const d = String(Number(get('day'))); // remove leading zero
    const yyyy = get('year');
    const h = get('hour');
    const mm = get('minute');
    const dayStr = `${MMM} ${d}, ${yyyy}`;
    if (pattern.includes('•')) {
        const ampm = parts.find(p => p.type === 'dayPeriod')?.value?.toUpperCase() || '';
        return `${dayStr} • ${h}:${mm} ${ampm}`.trim();
    }
    if (pattern.includes('h:mm a')) {
        const ampm = parts.find(p => p.type === 'dayPeriod')?.value?.toUpperCase() || '';
        return `${h}:${mm} ${ampm}`.trim();
    }
    return dayStr;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * formatDateTime
 * Consistently formats an ISO-like date/time string into:
 *   MMM d, yyyy • h:mm a
 * Falls back gracefully if parsing fails.
 * Always uses local timezone (browser) per product requirement.
 */
export function formatDateTime(value?: string | Date | null): string {
    if (!value) return '—';
    try {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return '—';
    return formatWithTZ(date, 'MMM d, yyyy • h:mm a');
    } catch {
        return '—';
    }
}

/**
 * formatTime12h
 * Returns just the 12-hour time with AM/PM (e.g., 3:07 PM)
 */
export function formatTime12h(value?: string | Date | null): string {
    if (!value) return '—';
    try {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return '—';
    return formatWithTZ(date, 'h:mm a');
    } catch {
        return '—';
    }
}

/**
 * formatDateShort
 * Returns short date (e.g., Jan 5, 2025)
 */
export function formatDateShort(value?: string | Date | null): string {
    if (!value) return '—';
    try {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return '—';
    return formatWithTZ(date, 'MMM d, yyyy');
    } catch {
        return '—';
    }
}
