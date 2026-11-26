/**
 * Reads `gh pr create` and `gh pr view` invocations out of a Bash command line a worker ran. A closed subset
 * of shell syntax: words, quotes, `;`, `&&`, `||`, pipes, newlines, plain redirections, and variables assigned
 * earlier on the same line. Command substitutions, subshells and unknown variables are opaque. A heredoc or
 * any other construct this reader does not follow makes the whole line unreadable, never a guess.
 */

interface Word { text: string; raw: string; dynamic: boolean }
interface Redirect { op: string; target?: Word }
interface SimpleCommand { words: Word[]; redirects: Redirect[]; pipedIn: boolean; pipedOut: boolean }

class Unreadable extends Error {}

/** Index just past the `)` that closes the group opened at `start`, skipping quoted text. */
function closing(line: string, start: number): number {
    let depth = 0, quote = '';
    for (let i = start; i < line.length; i++) {
        const c = line[i];
        if (quote) { if (c === '\\' && quote === '"') i++; else if (c === quote) quote = ''; continue; }
        if (c === '\\') { i++; continue; }
        if (c === "'" || c === '"') quote = c;
        else if (c === '(') depth++;
        else if (c === ')' && --depth === 0) return i + 1;
    }
    throw new Unreadable('unclosed group');
}

function simpleCommands(line: string): SimpleCommand[] {
    const vars = new Map<string, string | null>(), commands: SimpleCommand[] = [];
    const fresh = (pipedIn: boolean): SimpleCommand => ({ words: [], redirects: [], pipedIn, pipedOut: false });
    let current = fresh(false), word: Word | undefined, pending: string | undefined, quote = '', i = 0;
    const start = () => (word ??= { text: '', raw: '', dynamic: false });
    const end = () => {
        if (!word) return;
        if (pending) { current.redirects.push({ op: pending, target: word }); pending = undefined; } else current.words.push(word);
        word = undefined;
    };
    const finish = (piped: boolean) => {
        end();
        if (pending) throw new Unreadable('redirect without target');
        if (!current.words.length && !current.redirects.length) { if (piped || current.pipedIn) throw new Unreadable('empty pipeline'); return; }
        current.pipedOut = piped;
        if (!piped && !current.pipedIn && !current.redirects.length && current.words.every(w => /^[A-Za-z_][A-Za-z0-9_]*=/.test(w.raw)))
            for (const w of current.words) { const name = w.raw.slice(0, w.raw.indexOf('=')); vars.set(name, w.dynamic ? null : w.text.slice(name.length + 1)); }
        commands.push(current); current = fresh(piped);
    };
    const opaque = (from: number, to: number) => { const w = start(); w.raw += line.slice(from, to); w.dynamic = true; return to; };
    const expand = (at: number): number => {
        const w = start(), next = line[at + 1] ?? '';
        if (next === '(') return opaque(at, closing(line, at + 1));
        if (next === '{') {
            const close = line.indexOf('}', at); if (close < 0) throw new Unreadable('unclosed variable');
            const name = line.slice(at + 2, close), value = /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? vars.get(name) : null;
            w.raw += line.slice(at, close + 1); if (value === undefined || value === null) w.dynamic = true; else w.text += value;
            return close + 1;
        }
        const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(line.slice(at + 1))?.[0];
        if (name) { const value = vars.get(name); w.raw += `$${name}`; if (value === undefined || value === null) w.dynamic = true; else w.text += value; return at + 1 + name.length; }
        if (!next || /[\s"']/.test(next)) { w.text += '$'; w.raw += '$'; return at + 1; }
        return opaque(at, at + 2);
    };
    const backtick = (at: number) => { const close = line.indexOf('`', at + 1); if (close < 0) throw new Unreadable('unclosed backtick'); return opaque(at, close + 1); };
    while (i < line.length) {
        const c = line[i];
        if (quote === "'") { const w = start(); if (c === "'") quote = ''; else w.text += c; w.raw += c; i++; continue; }
        if (quote === '"') {
            const w = start();
            if (c === '"') { quote = ''; w.raw += c; i++; }
            else if (c === '\\' && '"\\$`\n'.includes(line[i + 1] ?? '')) { if (line[i + 1] !== '\n') w.text += line[i + 1]; w.raw += c + line[i + 1]; i += 2; }
            else if (c === '$') i = expand(i);
            else if (c === '`') i = backtick(i);
            else { w.text += c; w.raw += c; i++; }
            continue;
        }
        if (c === ' ' || c === '\t') { end(); i++; continue; }
        if (c === '\n' || c === ';') { finish(false); i++; continue; }
        if (c === '&') { if (line[i + 1] !== '&') throw new Unreadable('background or descriptor redirect'); finish(false); i += 2; continue; }
        if (c === '|') { if (line[i + 1] === '|') { finish(false); i += 2; } else { finish(true); i++; } continue; }
        if (c === '<' || c === '>') {
            if (c === '<' && line[i + 1] === '<') throw new Unreadable('heredoc');
            let op: string = c;
            if (c === '>' && word && word.raw === '2' && !word.dynamic) { word = undefined; op = '2>'; } else end();
            i++;
            if (c === '>' && line[i] === '>') { op += '>'; i++; }
            if (op === '2>' && line[i] === '&' && line[i + 1] === '1') { current.redirects.push({ op: '2>&1' }); i += 2; continue; }
            if (line[i] === '&' || pending) throw new Unreadable('unsupported redirect');
            pending = op; continue;
        }
        if (c === ')') throw new Unreadable('unopened group');
        if (c === '(') { i = opaque(i, closing(line, i)); continue; }
        if (c === '#' && !word) { while (i < line.length && line[i] !== '\n') i++; continue; }
        if (c === '\\') { if (line[i + 1] === '\n') { i += 2; continue; } const w = start(); w.text += line[i + 1] ?? ''; w.raw += line.slice(i, i + 2); i += 2; continue; }
        if (c === "'" || c === '"') { start().raw += c; quote = c; i++; continue; }
        if (c === '$') { i = expand(i); continue; }
        if (c === '`') { i = backtick(i); continue; }
        const w = start(); w.text += c; w.raw += c; i++;
    }
    if (quote) throw new Unreadable('unclosed quote');
    finish(false);
    return commands;
}

function read(line: string): SimpleCommand[] | undefined {
    try { return simpleCommands(line); } catch (error) { if (error instanceof Unreadable) return undefined; throw error; }
}

const named = (command: SimpleCommand, verb: string) => command.words.length >= 3 &&
    command.words.slice(0, 3).every((w, i) => !w.dynamic && w.text === ['gh', 'pr', verb][i]);

/** `--name value`, `--name=value` and short aliases; a repeated, unknown or dynamic flag fails the whole invocation. */
function flags(words: Word[], aliases: Record<string, string>, switches: string[]): Record<string, string> | undefined {
    const values: Record<string, string> = {};
    for (let k = 0; k < words.length; k++) {
        const w = words[k];
        if (w.dynamic) return undefined;
        const eq = w.text.startsWith('--') ? w.text.indexOf('=') : -1, name = eq > 0 ? w.text.slice(0, eq) : w.text, key = aliases[name];
        if (!key || key in values) return undefined;
        if (switches.includes(key)) { if (eq > 0) return undefined; values[key] = ''; continue; }
        const value = eq > 0 ? w.text.slice(eq + 1) : words[++k]?.dynamic === false ? words[k].text : undefined;
        if (value === undefined) return undefined;
        values[key] = value;
    }
    return values;
}

export interface RecordedCreate { repository: string; base: string; head: string; title: string; bodyFile: string; draft: boolean }
export interface RecordedView { number: number; repository: string; fields: string[]; stdout: string }

const CREATE = { '-R': 'repo', '--repo': 'repo', '-B': 'base', '--base': 'base', '-H': 'head', '--head': 'head', '-t': 'title', '--title': 'title',
    '-F': 'bodyFile', '--body-file': 'bodyFile', '-d': 'draft', '--draft': 'draft' };
const VIEW = { '-R': 'repo', '--repo': 'repo', '--json': 'json' };

/** Every `gh pr create` on the line; undefined when the line cannot be read or one of them is not a plain create. */
export function recordedCreates(line: string): RecordedCreate[] | undefined {
    const commands = read(line);
    if (!commands) return undefined;
    const creates: RecordedCreate[] = [];
    for (const command of commands.filter(c => named(c, 'create'))) {
        const f = flags(command.words.slice(3), CREATE, ['draft']);
        if (!f || command.pipedIn || command.pipedOut || command.redirects.some(r => r.op !== '2>&1') ||
            !f.repo || !f.base || !f.head || !f.title || !f.bodyFile) return undefined;
        creates.push({ repository: f.repo, base: f.base, head: f.head, title: f.title, bodyFile: f.bodyFile, draft: 'draft' in f });
    }
    return creates;
}

/** Each plain `gh pr view <number> --json <fields> > <file>` on the line: no filter, template or pipe. */
export function recordedViews(line: string): RecordedView[] {
    return (read(line) || []).flatMap(command => {
        const number = command.words[3];
        if (!named(command, 'view') || !number || number.dynamic ||!/^[1-9][0-9]*$/.test(number.text) || command.pipedIn || command.pipedOut) return [];
        const f = flags(command.words.slice(4), VIEW, []), out = command.redirects;
        if (!f?.repo || !f.json || out.length !== 1 || out[0].op !== '>' || !out[0].target || out[0].target.dynamic) return [];
        return [{ number: Number(number.text), repository: f.repo, fields: f.json.split(','), stdout: out[0].target.text }];
    });
}
