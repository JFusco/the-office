import { expect, test } from 'vitest';
import { packContextFailure, unpackContextFailure } from '../../../server/workers/context-failure-transport';
import { ContextReadChanged } from '../../../server/workers/session-context-lines';
import { SessionContextDeadline } from '../../../server/workers/session-context-deadline';
import { sessionInventoryFailureDetail } from '../../../server/workers/session-inventory-failure';

const posted = (error: unknown) => unpackContextFailure(structuredClone(packContextFailure(error)));

test('a failure posted from the thread is reported exactly as the same failure raised in place', () => {
    const failures = [
        new ContextReadChanged('Session context file changed during its read'),
        new SessionContextDeadline('01a1db6d-b715-7e53-9c86-24d6b31d6709', 'fold', 5131, 75810959, { phaseMS: 2237, activeMS: 4774, idleMS: 357 }),
        new Error('Session context scan exceeded its read deadline'),
        new Error('Session context file identity changed during its read'),
        new Error('Session context record coverage is unavailable'),
        Object.assign(new Error('no such file'), { code: 'ENOENT' }),
        Object.assign(new Error('denied'), { code: 'EACCES' }),
        new Error('Claude transcript identity does not match the live session'),
        new Error('Session context reader thread stopped'),
    ];
    for (const failure of failures) {
        const received = posted(failure);
        expect(sessionInventoryFailureDetail(received)).toBe(sessionInventoryFailureDetail(failure));
        expect(received.message).toBe(failure.message);
    }
    expect(posted(failures[0])).toBeInstanceOf(ContextReadChanged);
    expect(posted(failures[1])).toMatchObject({ phase: 'fold', bytes: 75810959, elapsedMS: 5131, phaseMS: 2237, activeMS: 4774, idleMS: 357 });
});

test('a thrown value that is not an error still arrives as a failure', () => {
    expect(posted('text')).toBeInstanceOf(Error);
    expect(packContextFailure({ code: 7 })).toEqual({ message: '' });
});
