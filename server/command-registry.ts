import { createHash } from 'node:crypto';
import { readFileSync, realpathSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { command } from './process';
export interface RegisteredCommand {
    id: string;
    program: string;
    args: string[];
    definitionHash: string;
    kind: 'check' | 'generator';
    outputs: string[];
    descriptions: string[];
}
export interface CommandScope {
    worktree: string;
    artifacts: string;
    scratch: string;
    nodeModules: string;
}
const inside = (root: string, path: string) => { const name = relative(realpathSync(root), realpathSync(path)); return name === '' || !name.startsWith('..') && !name.startsWith('/'); };
/** Registry descriptions are mapping evidence, never executable shell text. */
export class CommandRegistry {
    private commands = new Map<string, RegisteredCommand>();
    private packageDefinitions = new Map<string, {
        name: string;
        text: string;
    }>();
    constructor(private scope: CommandScope, private execute: typeof command = command) { }
    register(value: RegisteredCommand): void {
        if (!/^[a-z0-9][a-z0-9:._-]+$/i.test(value.id) || !value.definitionHash || this.commands.has(value.id))
            throw new Error('Command registration identity is invalid or duplicated');
        if (!['node', 'git'].includes(value.program) || value.program === 'git' && !['status', 'diff', 'show', 'log', 'rev-parse', 'merge-base'].includes(value.args[0]))
            throw new Error('Command is not a permitted development or inspection operation');
        if (value.args.some(arg => /[\x00\r\n]/.test(arg)) || value.outputs.some(path => !path.startsWith(this.scope.worktree + '/') && !path.startsWith(this.scope.artifacts + '/') && !path.startsWith(this.scope.scratch + '/')))
            throw new Error('Command scope is invalid');
        if (value.program === 'node' && (!value.args[0] || value.args[0].startsWith('-') || !existsSync(resolve(this.scope.worktree, value.args[0])) || !inside(this.scope.worktree, resolve(this.scope.worktree, value.args[0]))))
            throw new Error('Node entrypoint must be a registered script inside the owned worktree');
        if (value.outputs.some(path => !existsSync(path) || ![this.scope.worktree, this.scope.artifacts, this.scope.scratch].some(root => inside(root, path))))
            throw new Error('Command output escaped an owned root');
        this.commands.set(value.id, structuredClone(value));
    }
    registerPackageScript(name: string, kind: RegisteredCommand['kind'], outputs: string[] = []): RegisteredCommand {
        const packagePath = resolve(this.scope.worktree, 'package.json');
        if (!inside(this.scope.worktree, packagePath))
            throw new Error('Package manifest escaped the worktree');
        const scripts = JSON.parse(readFileSync(packagePath, 'utf8')).scripts, text = scripts?.[name];
        // Complex scripts need an explicit reviewed argv registration, not a shell fallback.
        if (typeof text !== 'string' || !/^node [\w./-]+(?: [\w./:=@-]+)*$/.test(text))
            throw new Error('Package script needs an explicit registered argv definition');
        const [program, ...args] = text.split(' '), definitionHash = createHash('sha256').update(JSON.stringify([name, text])).digest('hex');
        const entry = { id: `package:${name}`, program, args, definitionHash, kind, outputs, descriptions: [name, text] };
        this.register(entry);
        this.packageDefinitions.set(entry.id, { name, text });
        return entry;
    }
    map(descriptions: string[]): {
        description: string;
        commandId: string;
        definitionHash: string;
    }[] {
        return descriptions.map(description => {
            const matches = [...this.commands.values()].filter(value => value.id === description || value.descriptions.includes(description));
            if (matches.length !== 1)
                throw new Error(`Selected check needs a verified registry mapping: ${description}`);
            return { description, commandId: matches[0].id, definitionHash: matches[0].definitionHash };
        });
    }
    async run(id: string, expectedHash: string, selectors: string[] = [], editor = false): Promise<string> {
        const definition = this.commands.get(id);
        if (!definition || definition.definitionHash !== expectedHash)
            throw new Error('Command definition changed or is unregistered');
        const source = this.packageDefinitions.get(id);
        if (source && JSON.parse(readFileSync(resolve(this.scope.worktree, 'package.json'), 'utf8')).scripts?.[source.name] !== source.text)
            throw new Error('Package command definition changed after registration');
        if (definition.kind === 'generator' && !editor)
            throw new Error('A checks profile cannot run a source generator');
        for (const selector of selectors)
            if (!/^[\w./-]+$/.test(selector) || selector.startsWith('-') || !existsSync(resolve(this.scope.worktree, selector)) || !inside(this.scope.worktree, resolve(this.scope.worktree, selector)))
                throw new Error('Focused selector escaped the owned worktree');
        if (process.platform !== 'darwin' || !existsSync('/usr/bin/sandbox-exec'))
            throw new Error('Required subprocess scope enforcement is unavailable; retain the native stage until parity is verified');
        const quoted = (value: string) => JSON.stringify(realpathSync(value));
        const writable = [this.scope.artifacts, this.scope.scratch, ...definition.outputs, ...(editor ? [this.scope.worktree] : [])];
        const profile = `(version 1)(deny default)(allow process-fork)(allow signal (target self))(allow sysctl-read)(allow mach-lookup)(allow file-read* (subpath ${quoted(this.scope.worktree)}) (subpath ${quoted(this.scope.nodeModules)}) (subpath "/usr") (subpath "/System") (subpath "/Library") (subpath "/opt/homebrew") (literal "/dev/null") (literal "/dev/urandom"))(allow process-exec (literal ${quoted(process.execPath)}) (literal "/usr/bin/git"))(allow file-write* ${writable.map(path => `(subpath ${quoted(path)})`).join(' ')})(deny file-write* (subpath ${JSON.stringify(resolve(this.scope.worktree, '.git'))}))(deny network*)`;
        return this.execute('/usr/bin/sandbox-exec', ['-p', profile, definition.program === 'node' ? process.execPath : '/usr/bin/git', ...definition.args, ...selectors], { cwd: this.scope.worktree, timeout: 10 * 60000, readOnly: definition.kind === 'check' });
    }
}
