import { expect, test } from 'vitest';
import { DEFAULT_OFFICE_URL, officeUrl, privateDirectories, runnerPaths } from '../../../server/overseer/config';

test('control files, journals and state each have their own folder, and the runner data root is inside state', () => {
    const paths = runnerPaths('/runner');
    expect(paths).toMatchObject({
        control: '/runner/control', journal: '/runner/journal', state: '/runner/state', officeData: '/runner/state/office-data',
        stop: '/runner/control/STOP.json', pause: '/runner/control/pause.json', lock: '/runner/control/pass.lock',
        guard: '/runner/control/pass.lock.reclaim', failures: '/runner/journal/failures.jsonl', runnerState: '/runner/state/runner.json',
    });
    expect(privateDirectories(paths)).toEqual(['/runner/control', '/runner/journal', '/runner/state', '/runner/state/office-data']);
});

test('the Office URL defaults to the local service and accepts only a bare HTTP origin on a loopback host the Office answers', () => {
    expect(officeUrl({})).toBe(DEFAULT_OFFICE_URL);
    expect(officeUrl({ OVERSEER_OFFICE_URL: 'http://localhost:5000' })).toBe('http://localhost:5000');
    expect(officeUrl({ OVERSEER_OFFICE_URL: 'http://127.0.0.1:5000/' })).toBe('http://127.0.0.1:5000');
    // The Office's own origin check accepts no IPv6 loopback, so the runner refuses it with the same diagnostic as any other host.
    expect(() => officeUrl({ OVERSEER_OFFICE_URL: 'http://[::1]:5000/' })).toThrow('OVERSEER_OFFICE_URL must be an http: origin on 127.0.0.1 or localhost');
    for (const url of ['https://127.0.0.1:4318', 'http://example.com:4318', 'http://10.0.0.1:4318', 'http://127.0.0.2:4318', 'not a url'])
        expect(() => officeUrl({ OVERSEER_OFFICE_URL: url }), url).toThrow(/OVERSEER_OFFICE_URL/);
    for (const url of ['http://user:secret@127.0.0.1:4318', 'http://127.0.0.1:4318/api', 'http://127.0.0.1:4318/?a=1', 'http://127.0.0.1:4318/#x', 'http://127.0.0.1:4318/?', 'http://127.0.0.1:4318#'])
        expect(() => officeUrl({ OVERSEER_OFFICE_URL: url }), url).toThrow('bare origin');
});
