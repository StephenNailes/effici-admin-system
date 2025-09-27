import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

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
        // Example: Jan 5, 2025 • 3:07 PM
        return format(date, 'MMM d, yyyy • h:mm a');
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
        return format(date, 'h:mm a');
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
        return format(date, 'MMM d, yyyy');
    } catch {
        return '—';
    }
}
