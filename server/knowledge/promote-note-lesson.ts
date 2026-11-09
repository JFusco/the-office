import { z } from 'zod';
import { LESSON_KINDS, LESSON_STAGES } from '../../src/contracts/knowledge';
import { normalizeStatement } from './accept-retrospective';
import type { OfficeKnowledgeStore } from './office-lessons';
import type { Store } from '../store/store';

const Input = z.object({ noteId: z.string().uuid(), statement: z.string().trim().min(12).max(300), detail: z.string().trim().min(1).max(1500),
    kind: z.enum(LESSON_KINDS as ['convention', 'pitfall', 'process', 'tooling']), stages: z.array(z.enum(LESSON_STAGES as ['intake', 'implement', 'review', 'validate', 'repair', 'maintenance', 'any'])).min(1).max(7) }).strict();

/** Explicit operator promotion of a reviewed saved note; chat/model outputs cannot activate lessons. */
export function promoteNoteLesson(control: OfficeKnowledgeStore, store: Store, input: unknown): string {
    const data = Input.parse(input), note = store.state.projectNotes.find(note => note.id === data.noteId);
    if (!note || !store.state.messages.some(message => message.id === note.requestId && message.from === 'human' && message.status === 'answered')) throw new Error('A saved note from a completed human request is required');
    const id = `operator-note:${store.project.id}:${note.id}`;
    return control.updateKnowledge(knowledge => {
        const old = knowledge.lessons.find(lesson => lesson.id === id);
        if (old) {
            if (old.statement !== data.statement || old.detail !== data.detail || old.kind !== data.kind || JSON.stringify(old.stages) !== JSON.stringify([...new Set(data.stages)])) throw new Error('Promotion already exists with different approved content');
            return id; // A retired lesson remains retired; activation is never silently replayed.
        }
        if (knowledge.lessons.some(lesson => lesson.status === 'active' && normalizeStatement(lesson.statement) === normalizeStatement(data.statement))) throw new Error('An equivalent active Office lesson already exists');
        const at = control.clock.now().toISOString(), ticket = store.state.tickets.find(ticket => ticket.key === note.ticket);
        knowledge.lessons.push({ id, scope: 'office', tier: 'guidance', revision: 1, kind: data.kind, statement: data.statement, detail: data.detail, stages: [...new Set(data.stages)], paths: [], status: 'active',
            evidence: [{ kind: 'artifact', ref: `project-note:${store.project.id}:${note.id}`, url: '', detail: `Explicitly promoted by Joe from the reviewed note: ${note.summary}` }, ...(ticket ? [{ kind: 'ticket' as const, ref: ticket.key, url: ticket.url, detail: 'Source incident tracking issue' }] : [])],
            sourceRetrospectiveId: id, recurrences: [], createdAt: at, updatedAt: at });
        return id;
    });
}
