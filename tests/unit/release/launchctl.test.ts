import { expect, test } from 'vitest';
import { bootout, bootstrap, launchDomain, serviceLoaded } from '../../../server/release/launchctl';

const runner = (answer: () => string) => { const calls: any[] = []; return { calls, execute: (async (program: string, args: string[], options: any) => { calls.push({ program, args, readOnly: !!options?.readOnly }); return answer(); }) as any }; };

test('the service is absent only when launchd says it could not find it; any other failure is inconclusive', async () => {
    const present = runner(() => 'state = running');
    expect(await serviceLoaded(present.execute, 'gui/505')).toBe(true);
    expect(present.calls).toEqual([{ program: 'launchctl', args: ['print', 'gui/505/com.jfusco.living-office'], readOnly: true }]);
    expect(await serviceLoaded(runner(() => { throw new Error('launchctl exited 113: Bad request.\nCould not find service "com.jfusco.living-office" in domain for user gui: 505'); }).execute, 'gui/505')).toBe(false);
    await expect(serviceLoaded(runner(() => { throw new Error('launchctl read timed out'); }).execute, 'gui/505')).rejects.toThrow('timed out');
});

test('stop removes the service from its domain and start loads the plist into it', async () => {
    const { calls, execute } = runner(() => '');
    await bootout(execute, 'gui/505'); await bootstrap(execute, 'gui/505', '/p/service.plist');
    expect(calls.map(call => call.args)).toEqual([['bootout', 'gui/505/com.jfusco.living-office'], ['bootstrap', 'gui/505', '/p/service.plist']]);
    expect(calls.every(call => !call.readOnly)).toBe(true);
    expect(launchDomain(505)).toBe('gui/505');
});
