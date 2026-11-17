import { expect, test } from 'vitest';
import { transitionWithComment } from '../../../../server/cec/parking/commented-transition';
import { CEC } from '../../../../server/office/config';

test('one REST transition carries its comment in the request and keeps the credential out of the arguments', async () => {
    const calls: any[] = [];
    const execute: any = async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return ''; };
    await transitionWithComment(execute, { user: 'office@example.test', token: 'to"k\\en' }, 'CEC-900', '131', 'Office decision a1: Which "locale"?\nSecond line\n\nMove it back to QA.');
    expect(calls).toHaveLength(1);
    const [{ program, args, options }] = calls;
    expect(program).toBe('curl');
    expect(options.readOnly).toBe(false);
    expect(args[0]).toBe('-q');
    expect(args).toEqual(expect.arrayContaining(['--fail-with-body', '--output', '/dev/stderr', '--config', '-']));
    expect(args.join(' ')).not.toMatch(/to"k|office@example/);
    const setting = (name: string) => JSON.parse(`"${options.input.split('\n').find((line: string) => line.startsWith(`${name} = "`)).slice(name.length + 4, -1)}"`);
    expect(setting('url')).toBe(`${CEC.site}/rest/api/3/issue/CEC-900/transitions`);
    expect(setting('request')).toBe('POST');
    expect(setting('user')).toBe('office@example.test:to"k\\en');
    expect(JSON.parse(setting('data-raw'))).toEqual({ transition: { id: '131' }, update: { comment: [{ add: { body: { type: 'doc', version: 1, content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Office decision a1: Which "locale"?' }, { type: 'hardBreak' }, { type: 'text', text: 'Second line' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Move it back to QA.' }] }] } } }] } });
});

test('a refused or failed request is passed on for read-back, never swallowed', async () => {
    await expect(transitionWithComment((async () => { throw new Error('curl exited 22'); }) as any, { user: 'u', token: 't' }, 'CEC-900', '131', 'x')).rejects.toThrow('curl exited 22');
});
