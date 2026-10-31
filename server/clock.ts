export interface Clock {
    now(): Date;
    monotonic(): number;
}
export const systemClock: Clock = { now: () => new Date(), monotonic: () => performance.now() };
export const EASTERN = 'America/New_York';
// Intl formatters retain only fixed locale/options; each call still converts its actual instant.
const easternDayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: EASTERN, year: 'numeric', month: '2-digit', day: '2-digit' });
const easternPartsFormatter = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
export function easternDay(value: Date | number): string {
    return easternDayFormatter.format(value);
}
// Solve the offset at the actual local instant, including DST change dates.
export function easternInstant(day: string, hour = 0): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isInteger(hour) || hour < 0 || hour > 23)
        throw new Error('Invalid Eastern date/hour');
    const desired = Date.parse(`${day}T${String(hour).padStart(2, '0')}:00:00Z`);
    let instant = desired;
    for (let n = 0; n < 4; n++) {
        const parts = easternPartsFormatter.formatToParts(instant);
        const values = Object.fromEntries(parts.map(p => [p.type, p.value]));
        const local = Date.parse(`${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}Z`);
        const next = instant + desired - local;
        if (next === instant)
            break;
        instant = next;
    }
    const result = new Date(instant);
    if (easternDay(result) !== day)
        throw new Error('Invalid Eastern calendar day');
    return result;
}
export function addDays(day: string, count: number): string {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
}
