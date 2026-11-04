import type { command } from '../../workers/process';

/** Rebuild a linear PR range with identical trees, authors, dates and topology; only messages change. */
export async function rewordCommits(execute: typeof command, cwd: string, base: string, head: string, messages: { sha: string; message: string }[]) {
    const read = async (...args: string[]) => (await execute('git', args, { cwd, readOnly: true, timeout: 30000 })).trim();
    const shas = (await read('rev-list', '--reverse', `${base}..${head}`)).split('\n').filter(Boolean);
    if (!shas.length || shas.length > 100 || !messages.length || new Set(messages.map(m => m.sha)).size !== messages.length ||
        messages.some(m => !shas.includes(m.sha) || !m.message.trim() || m.message.includes('\0')))
        throw new Error('Commit-message proposal must name unique commits in the bounded PR range');
    // Validate the whole chain before writing any replacement objects.
    const originals = [];
    let previous = '';
    for (const sha of shas) {
        const raw = await execute('git', ['cat-file', 'commit', sha], { cwd, readOnly: true });
        const split = raw.indexOf('\n\n'), headers = raw.slice(0, split), parents = [...headers.matchAll(/^parent ([a-f0-9]{40})$/gm)].map(m => m[1]);
        if (split < 0 || parents.length !== 1 || previous && parents[0] !== previous || /^(?:gpgsig|mergetag) /m.test(headers))
            throw new Error('Signed or nonlinear history needs explicit reconciliation before rewording');
        if (!previous) await execute('git', ['merge-base', '--is-ancestor', parents[0], base], { cwd, readOnly: true });
        originals.push({ sha, raw, headers, parent: parents[0], message: raw.slice(split + 2) }); previous = sha;
    }
    if (previous !== head) throw new Error('Commit range does not end at the exact diagnosed head');
    const rewritten = new Map<string, string>();
    for (const original of originals) {
        const message = messages.find(m => m.sha === original.sha)?.message ?? original.message;
        const parent = rewritten.get(original.parent) || original.parent;
        const raw = `${original.headers.replace(`parent ${original.parent}`, `parent ${parent}`)}\n\n${message.endsWith('\n') ? message : message + '\n'}`;
        const sha = raw === original.raw ? original.sha : (await execute('git', ['hash-object', '-t', 'commit', '-w', '--stdin'], { cwd, input: raw })).trim();
        if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Reworded commit identity unavailable');
        rewritten.set(original.sha, sha);
    }
    const next = rewritten.get(head)!;
    if (next === head || await read('rev-parse', `${next}^{tree}`) !== await read('rev-parse', `${head}^{tree}`))
        throw new Error('Commit-message repair must change messages and preserve the exact source tree');
    return { head: next, mapping: [...rewritten].map(([oldHead, newHead]) => ({ oldHead, newHead })) };
}
