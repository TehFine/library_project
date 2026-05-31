/**
 * Returns the local date string in YYYY-MM-DD format.
 * 
 * IMPORTANT: Do NOT use `date.toISOString().split('T')[0]` as that returns the UTC date,
 * which can be off by one day in timezones ahead of UTC (e.g., UTC+7 Vietnam).
 * 
 * Instead, use this helper which uses local timezone methods (getFullYear, getMonth, getDate).
 */
export function toLocalDateStr(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
