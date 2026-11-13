import { expect, test } from 'vitest';
import { prerequisiteKeys } from '../../../src/work/pm-queue';
import type { AssignmentReview } from '../../../src/shared';

const review = (targets: { kind: string; id: string }[]) => ({ prerequisites: targets.map(target => ({ target })) }) as unknown as AssignmentReview;

test('prerequisites are named by ticket or pull request, never by an internal id, and stay countable', () => {
    expect(prerequisiteKeys(review([{ kind: 'issue', id: '255' }, { kind: 'pr', id: '177' }, { kind: 'issue', id: '255' }]))).toEqual(['GH-255', 'PR #177']);
    expect(prerequisiteKeys(review([{ kind: 'delivery', id: '3f2a9c1e-0b7d-4e8a-9c1d-2f4b6a8c0e12' }, { kind: 'delivery', id: '95134ecf-5963-48f3-beed-c5466fb77d4a' }, { kind: 'maintenance', id: 'ced1b10e-ce8d-453e-bf59-afb913cd906b' }]))).toEqual(['Delivery ×2', 'Maintenance run']);
    expect(prerequisiteKeys(review([]))).toEqual([]);
});
