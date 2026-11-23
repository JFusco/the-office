import { expect, test } from 'vitest';
import { followUpPicture } from '../../../server/it/follow-up-picture';
import { signInSteps } from '../../../server/it/sign-in-steps';
import type { ITFollowUp } from '../../../src/shared';

const signIn = (failure?: string): ITFollowUp => ({ id: 'login:github', owner: 'You', detail: 'Check gh auth status in your terminal.', title: 'Only you can do this: sign in to GitHub', ownerSteps: signInSteps({ id: 'github', name: 'GitHub', failure }) });

test('the provider\'s wording alone is not a change in what is outstanding', () => {
    expect(followUpPicture([signIn('HTTP 401 (request 111)')])).toBe(followUpPicture([signIn('HTTP 401 (request 222)')]));
    // Whether the provider said anything at all is a change; so is anything the Office itself wrote.
    expect(followUpPicture([signIn('HTTP 401')])).not.toBe(followUpPicture([signIn()]));
    const base = signIn('HTTP 401'), reworded = { ...base, ownerSteps: { ...base.ownerSteps!, why: 'The Office explains it another way.' } };
    expect(followUpPicture([reworded])).not.toBe(followUpPicture([base]));
    const plain = signIn(), plainReworded = { ...plain, ownerSteps: { ...plain.ownerSteps!, why: 'The Office explains it another way.' } };
    expect(followUpPicture([plainReworded])).not.toBe(followUpPicture([plain]));
});

test('everything else about a follow-up is a change: its steps, its detail, its owner, whether it has steps at all', () => {
    const base = signIn('HTTP 401'), picture = followUpPicture([base]);
    expect(followUpPicture([{ ...base, ownerSteps: { ...base.ownerSteps!, steps: [{ text: 'Another step' }] } }])).not.toBe(picture);
    expect(followUpPicture([{ ...base, ownerSteps: { ...base.ownerSteps!, doneWhen: 'Never' } }])).not.toBe(picture);
    expect(followUpPicture([{ ...base, detail: 'Other' }])).not.toBe(picture);
    expect(followUpPicture([{ ...base, owner: 'Morgan' }])).not.toBe(picture);
    expect(followUpPicture([{ id: base.id, owner: base.owner, detail: base.detail }])).not.toBe(picture);
    expect(followUpPicture([])).not.toBe(picture);
    // Follow-ups without steps compare exactly as they did before.
    const plain: ITFollowUp[] = [{ id: 'a', owner: 'IT', detail: 'one', nextAt: '2026-11-23T00:00:00Z' }];
    expect(followUpPicture(plain)).toBe(JSON.stringify(plain));
});
