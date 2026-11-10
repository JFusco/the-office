import type { Lesson } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { OfficeKnowledgeStore } from '../office-lessons';
import type { SourceRegistry } from './registry';
import { proofBindings } from './proof-scope';

/** Derived review metadata is idempotent; registry withdrawal already prevents delivery. */
export function reviewSourceWithdrawals(registry:SourceRegistry,stores:Iterable<Store>,office?:OfficeKnowledgeStore):number {
    const withdrawn=new Set(registry.all().filter(source=>source.state==='withdrawn').map(source=>source.id));
    if(!withdrawn.size)return 0;
    const needs=(lesson:Lesson)=>(!lesson.needsReview||lesson.sourceReviewReason!=='source-withdrawn')&&lesson.evidence.some(proof=>proofBindings(proof).some(binding=>withdrawn.has(binding.sourceId)));
    const mark=(lessons:Lesson[])=>{let count=0;for(const lesson of lessons)if(needs(lesson)){lesson.needsReview=true;lesson.sourceReviewReason='source-withdrawn';lesson.updatedAt=registry.clock.now().toISOString();count++;}return count;};
    let changed=0;
    if(office?.knowledge().lessons.some(needs))office.updateKnowledge(knowledge=>{changed+=mark(knowledge.lessons);});
    for(const store of stores){const knowledge=store.state.knowledge;if(!knowledge)continue;const count=mark([...knowledge.lessons,...(knowledge.officeLessons||[])]);if(count){store.save();changed+=count;}}
    return changed;
}
