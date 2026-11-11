import type { KnowledgeSourceBinding, KnowledgeState, Lesson, LessonEvidence } from '../../src/contracts/knowledge';
import { proofBindings } from './sources/proof-scope';

type CurationAction = 'add' | 'update' | 'supersede' | 'share';
type Curation = 'added' | 'updated' | 'superseded' | 'shared' | 'skipped';

/** New proofs join the target's. A proof already held keeps every source dependency either copy carries. */
function mergeEvidence(known: LessonEvidence[], proposed: LessonEvidence[]): LessonEvidence[] {
    const key = (binding: KnowledgeSourceBinding) => JSON.stringify(binding);
    return [...known.map(proof => {
        const held = new Set(proofBindings(proof).map(key)), added: KnowledgeSourceBinding[] = [];
        for (const binding of proposed.filter(next => next.ref === proof.ref).flatMap(proofBindings)) if (!held.has(key(binding))) { held.add(key(binding)); added.push(binding); }
        return added.length ? { ...proof, sourceBindings: [...(proof.sourceBindings || []), ...added] } : proof;
    }), ...proposed.filter(proof => !known.some(item => item.ref === proof.ref))];
}

/**
 * Applies Harper's decision about one proposed lesson. Harper decides; this is the only code that changes the set.
 * `update` edits an active project lesson in place. `supersede` retires it and adds the replacement in the same
 * transaction, so two versions are never both active. `share` adds nothing here: the caller files an office proposal.
 * A target that is missing, retired or office-wide is skipped; office lessons change only through Joe.
 */
export function curateLesson(knowledge: KnowledgeState, proposed: Lesson, action: CurationAction, targetId: string, elsewhere: ReadonlySet<string>, now: string): Curation {
    if (action === 'add') { knowledge.lessons.push(proposed); return 'added'; }
    if (action === 'share') return elsewhere.has(targetId) ? 'shared' : 'skipped';
    const target = knowledge.lessons.find(lesson => lesson.id === targetId && lesson.status === 'active');
    if (!target) return 'skipped';
    if (action === 'update') {
        const { when, statement, check, detail, kind, stages, paths } = proposed;
        Object.assign(target, { when, statement, check, detail, kind, stages, paths, revision: (target.revision || 1) + 1, updatedAt: now,
            evidence: mergeEvidence(target.evidence, proposed.evidence) });
        return 'updated';
    }
    Object.assign(target, { status: 'retired', retiredAt: now, retiredBy: 'harper', supersededBy: proposed.id, revision: (target.revision || 1) + 1, updatedAt: now });
    knowledge.lessons.push({ ...proposed, supersedes: target.id });
    return 'superseded';
}
