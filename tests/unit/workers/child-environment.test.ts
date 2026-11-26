import { afterEach, expect, test } from 'vitest';
import { childEnvironment } from '../../../server/workers/child-environment';
import { spawnCommand } from '../../../server/workers/spawn-command';

const previous = { GH_TOKEN: process.env.GH_TOKEN, OFFICE_ENV_KEEP: process.env.OFFICE_ENV_KEEP };
afterEach(() => {
    for (const [name, value] of Object.entries(previous)) value === undefined ? delete process.env[name] : (process.env[name] = value);
});

test('removals apply to a replacement map and leave its other entries as given', () => {
    const replaced: NodeJS.ProcessEnv = Object.assign(Object.create(null), { PATH: '/usr/bin:/bin', GH_TOKEN: 'synthetic-replaced', KEEP: '1' });
    expect({ ...childEnvironment({ envRemove: ['GH_TOKEN', 'GITHUB_TOKEN'] }, replaced) }).toEqual({ PATH: '/usr/bin:/bin', KEEP: '1' });
});

test('removals apply to the inherited environment before env, so a caller value for a removed name still reaches the child', () => {
    process.env.GH_TOKEN = 'synthetic-ambient';
    process.env.OFFICE_ENV_KEEP = 'kept';
    const merged = childEnvironment({ envRemove: ['GH_TOKEN'] });
    expect(merged.GH_TOKEN).toBeUndefined();
    expect(merged.OFFICE_ENV_KEEP).toBe('kept');
    expect(childEnvironment({ envRemove: ['GH_TOKEN'], env: { GH_TOKEN: 'synthetic-scoped' } }).GH_TOKEN).toBe('synthetic-scoped');
    expect(process.env.GH_TOKEN).toBe('synthetic-ambient');
});

test('with nothing to remove the spawn environment is what it was before: the replacement, the merge, or the service environment itself', () => {
    const replaced: NodeJS.ProcessEnv = Object.assign(Object.create(null), { PATH: '/usr/bin' });
    expect(childEnvironment({}, replaced)).toBe(replaced);
    expect(childEnvironment({})).toBe(process.env);
    expect(childEnvironment({ env: { OFFICE_ENV_KEEP: 'x' } }).OFFICE_ENV_KEEP).toBe('x');
});

test('a real child given a replaced environment and a removal sees neither the service environment nor the removed name', async () => {
    process.env.OFFICE_ENV_KEEP = 'service-only';
    const out = await spawnCommand(process.execPath, ['-e', 'process.stdout.write(JSON.stringify({ gh: process.env.GH_TOKEN ?? "ABSENT", keep: process.env.OFFICE_ENV_KEEP ?? "ABSENT", own: process.env.OWN ?? "ABSENT" }))'],
        { replaceEnv: { PATH: '/usr/bin:/bin', GH_TOKEN: 'synthetic-replaced', OWN: 'own' }, envRemove: ['GH_TOKEN'], readOnly: true });
    expect(JSON.parse(out)).toEqual({ gh: 'ABSENT', keep: 'ABSENT', own: 'own' });
});
