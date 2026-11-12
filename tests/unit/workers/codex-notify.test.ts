import { expect, test } from 'vitest';
import { codexNotifyArguments } from '../../../server/workers/codex-notify';

test("Codex workers launch without the operator's turn-ended notify program; Claude workers are unchanged", () => {
    expect(codexNotifyArguments('codex')).toEqual(['-c', 'notify=[]']);
    expect(codexNotifyArguments('claude')).toEqual([]);
});
