import { addDays, easternDay, easternInstant } from '../office/clock';

export function reviewWeekday(date: string): boolean {
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    return day >= 1 && day <= 5;
}

/** No collection or catch-up on weekends; weekdays coalesce to the latest due weekday. */
export function dailyReviewDate(now: Date): string | undefined {
    let date = easternDay(now);
    if (!reviewWeekday(date)) return;
    if (now < easternInstant(date, 17)) date = addDays(date, -1);
    while (!reviewWeekday(date)) date = addDays(date, -1);
    return date;
}
