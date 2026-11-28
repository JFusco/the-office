import { expect, test } from 'vitest';
import { refuse, TrialRefused } from '../../../../../server/github/identity/app-trial/trial-refusal';

test('a refusal names the trial and its reason, and is recognizable by type', () => {
    expect(() => refuse('the issue is held')).toThrow(TrialRefused);
    expect(() => refuse('the issue is held')).toThrow('The App trial was refused before dispatch: the issue is held');
});
