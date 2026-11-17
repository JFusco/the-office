import type { ProjectPolicy } from '../office/project-policy';

/** The checkpoint schedule as people read it, e.g. "Weekdays · 9:00 AM America/New_York". */
export function checkpointLabel({ hour, weekends }: ProjectPolicy['checkpoint']): string {
    return `${weekends ? 'Daily' : 'Weekdays'} · ${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'} America/New_York`;
}
