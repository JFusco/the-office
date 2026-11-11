import { describe,it,expect } from 'vitest';
import { brainFixture } from '../../../browser/brain-fixture';
import { stablePosition } from '../../../../src/knowledge/map/layout';
describe('scoped knowledge views', () => {
    it('serves retained citations and evidence and denies another project', async () => {
        const fixture = brainFixture();
        try {
            const read = async (path: string, project = 'cec') => (await fixture.read(new URL(`http://localhost/api/knowledge/${path}`),project))!;
            const search = await (await read('search?q=schema')).json(); expect(search.office.length).toBeGreaterThan(0); expect(search.technicalStatus).toBe('unavailable');
            const evidence = search.office.find((x: { reference: { kind: string } }) => x.reference.kind === 'source');
            expect((await read(`evidence?id=${evidence.reference.id}`)).status).toBe(200);
            expect((await read(`evidence?id=${evidence.reference.id}`,'cms-field-vocabulary')).status).toBe(404);
            const map = await (await read('map')).json(); expect(map.edges.some((e: { kind: string }) => e.kind === 'citation')).toBe(true);
            expect((await (await read('map','cms-field-vocabulary')).json()).nodes).toHaveLength(1);
            const activity = await (await read('activity')).json(); expect(activity.retrieved).toBe(1); expect(activity.verified).toBe(1); expect(activity.events.some((e: {kind:string}) => e.kind === 'admitted')).toBe(true);
        } finally { fixture.close(); }
    });
    it('keeps ID-derived coordinates stable across filtering and rerenders', () => {
        const a = stablePosition('evidence:123','evidence',['project','source','evidence','lesson']);
        expect(a).toEqual(stablePosition('evidence:123','evidence',['project','source','evidence','lesson']));
        expect(Object.values(a).every(Number.isFinite)).toBe(true);
    });
});
