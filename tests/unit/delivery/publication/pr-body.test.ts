import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { lintPRContent, PRContentRejected } from '../../../../server/delivery/publication/pr-body';
import { CommandFailure, workerFailure } from '../../../../server/workers/process';

const roots: string[] = [];
const inherited = process.env.PR_BODY;
afterEach(() => {
    roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true }));
    if (inherited === undefined) delete process.env.PR_BODY;
    else process.env.PR_BODY = inherited;
});

test.each(['content', 'authentication', 'timeout', 'configuration', 'tool', 'unknown', 'unsupported-rule'])('commitlint stdout grants only known content authority: %s', async kind => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-pr-title-')); roots.push(root);
    writeFileSync(resolve(root, 'commitlint.config.cjs'), 'module.exports = {};');
    const title = 'bad';
    const stdout = kind === 'configuration' ? '⧗   --- input ---\nbad\n✖   Please add rules [empty-rules]\n\n✖   found 1 problems, 0 warnings\n' :
        kind === 'unknown' ? 'Unable to load a tool\n' :
        `⧗   --- input ---\n${title}\n✖   subject may not be empty [${kind === 'unsupported-rule' ? 'unknown-rule' : 'subject-empty'}]\n\n✖   found 1 problems, 0 warnings\nⓘ   Get help: https://commitlint.js.org/#/reference-rules\n\n`;
    const stderr = kind === 'tool' ? 'Cannot load commitlint configuration' : '';
    const error = new CommandFailure(workerFailure('pnpm', kind === 'configuration' ? 9 : 1, stdout, stderr),
        kind === 'authentication' ? 'authentication' : kind === 'timeout' ? 'transient-read' : 'other', true);
    expect(error.message).not.toContain('subject may not be empty');
    const run = () => lintPRContent((async (program, args, options) => {
        expect(program).toBe('pnpm'); expect(args).toEqual(['exec', 'commitlint', '--config', 'commitlint.config.cjs']);
        expect(options).toMatchObject({ cwd: root, input: `${title}\n`, readOnly: true });
        options?.onOutput?.('stdout', stdout.slice(0, 20)); options?.onOutput?.('stdout', stdout.slice(20));
        options?.onOutput?.('stderr', stderr);
        throw error;
    }) as Parameters<typeof lintPRContent>[0], root, { title, body: 'Closes #5', source: 'developer' }, 5);
    if (kind === 'content') await expect(run()).rejects.toBeInstanceOf(PRContentRejected);
    else await expect(run()).rejects.toBe(error);
});

test('a repository body linter receives the selected bytes even when PR_BODY is inherited', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-pr-body-'));
    roots.push(root);
    writeFileSync(resolve(root, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node body-lint.cjs' } }));
    process.env.PR_BODY = 'Old unrelated body: Closes #999';
    const body = '## Summary\nSelected body.\n## Linked issue\nCloses #5\n';
    let calls = 0;
    await lintPRContent((async (program, args, options) => {
        calls++;
        expect(program).toBe('pnpm');
        expect(args).toEqual(['run', '--silent', 'lint:pr']);
        // The CMS linter prefers PR_BODY over stdin. An inherited value must not shadow this proposal.
        const effective = options?.env?.PR_BODY ?? process.env.PR_BODY ?? options?.input;
        if (effective !== body) throw new Error('Repository linter inspected a different body');
        expect(options?.input).toBe(body);
        expect(options?.cwd).toBe(root);
        expect(options?.readOnly).toBe(true);
        return '';
    }) as Parameters<typeof lintPRContent>[0], root, { title: 'fix: selected body', body, source: 'developer' }, 5);
    expect(calls).toBe(1);
    expect(process.env.PR_BODY).toBe('Old unrelated body: Closes #999');
});
