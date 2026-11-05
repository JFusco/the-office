import { z } from 'zod';
import type { ControlStore } from '../store/control-store';

const Briefing = z.object({
    summary: z.string().trim().min(1).max(1500),
    goals: z.array(z.object({ projectId: z.string(), goalId: z.string(), progress: z.string().trim().min(1).max(350), blockers: z.array(z.string().min(1).max(220)).max(3) }).strict()).max(200),
}).strict();

/** Reword a historical review without changing its assessment, goal states, or evidence. */
export function saveReviewBriefing(control: ControlStore, id: string, revision: number, input: unknown) {
    const briefing = Briefing.parse(input);
    return control.update(id, revision, report => {
        if (!['completed', 'conflicted'].includes(report.status)) throw new Error('Only finished reviews can be reformatted');
        const projects = (report.facts as { projects?: { projectId: string; goals: { id: string; mapping?: string }[] }[] })?.projects || [];
        const expected = projects.flatMap(project => project.goals.filter(goal => goal.mapping !== 'unmapped').map(goal => `${project.projectId}:${goal.id}`)).sort();
        const supplied = briefing.goals.map(goal => `${goal.projectId}:${goal.goalId}`).sort();
        if (JSON.stringify(expected) !== JSON.stringify(supplied)) throw new Error('Briefing must cover each saved goal exactly once');
        report.briefing = briefing;
    });
}
