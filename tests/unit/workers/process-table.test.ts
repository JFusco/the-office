import { expect, test } from 'vitest';
import { processTable } from '../../../server/workers/process-table';

test('reads each process parent and whitespace-normalised start time, skipping lines that are not a process', () => {
    const { parents, started } = processTable(' 52     1 Fri Oct  9 16:27:57 2026\n 53    52 Thu Nov 12 09:44:09 2026\n 54    52\nnoise\n 0 1 x\n 55 0 x\n');
    expect([...parents]).toEqual([[52, 1], [53, 52], [54, 52]]);
    expect([...started]).toEqual([[52, 'Fri Oct 9 16:27:57 2026'], [53, 'Thu Nov 12 09:44:09 2026']]);
    expect(processTable('')).toEqual({ parents: new Map(), started: new Map() });
});
