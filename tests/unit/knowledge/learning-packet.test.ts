import { test, expect } from 'vitest';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { freezeLearningPacket } from '../../../server/knowledge/learning-packet';
import { recordLearningOpportunity } from '../../../server/knowledge/learning-events';
import { retrospectiveFacts } from '../../../server/knowledge/retrospective-facts';
import { jobSubject } from '../../../server/knowledge/retrospective-subject';
import { job, knowledgeStore, opportunity } from './knowledge-fixture';
test('retry reuses its original packet; changed or missing proof cannot be replaced with current source', () => {
    const f = knowledgeStore();
    try {
        recordLearningOpportunity(f.store, opportunity()); const pending = f.store.state.knowledge!.pending[0];
        const folder = `${f.store.dataRoot}/frozen`; mkdirSync(folder);
        const original = freezeLearningPacket(f.store, pending, folder, () => retrospectiveFacts(f.store, jobSubject(f.store, job()), pending));
        expect(freezeLearningPacket(f.store, pending, folder, () => { throw Error('must not rebuild'); })).toEqual(original);
        writeFileSync(`${folder}/facts.json`, '{}'); expect(() => freezeLearningPacket(f.store, pending, folder, () => original)).toThrow('changed');
        unlinkSync(`${folder}/facts.json`); expect(() => freezeLearningPacket(f.store, pending, folder, () => original)).toThrow('unavailable');
    } finally { f.close(); }
});
