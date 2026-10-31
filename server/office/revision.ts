import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { ROOT } from './config';
/** Captured once, separate from mutable event revisions. */
export function runtimeRevision(root = ROOT, assets = resolve(root, 'dist')) {
    const files: string[] = [];
    const walk = (directory: string) => {
        if (!existsSync(directory))
            return;
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const path = resolve(directory, entry.name);
            if (entry.isDirectory())
                walk(path);
            else if (entry.isFile())
                files.push(path);
        }
    };
    for (const directory of ['server', 'src'])
        walk(resolve(root, directory));
    walk(assets);
    for (const name of ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'vite.config.ts'])
        if (existsSync(resolve(root, name)))
            files.push(resolve(root, name));
    const manifest = files.sort().map(path => ({ path: path.startsWith(assets + '/') ? `dist/${relative(assets, path)}` : relative(root, path), hash: createHash('sha256').update(readFileSync(path)).digest('hex') })).sort((a, b) => a.path.localeCompare(b.path));
    return { hash: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'), manifest };
}
