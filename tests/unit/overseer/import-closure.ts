import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Test support: every module a TypeScript file loads at run time, following the repository's own
 * resolution settings. Type-only imports and exports are skipped, since they are erased; every
 * other import, re-export, side-effect import and literal dynamic `import()` is followed. A
 * package is resolved to a runtime file but not walked into. An edge that cannot be resolved, or a
 * dynamic import whose target is not a literal, fails the walk rather than being left out.
 */

const repository = resolve(__dirname, '../../..');

function compilerOptions(): ts.CompilerOptions {
    const config = ts.readConfigFile(resolve(repository, 'tsconfig.json'), ts.sys.readFile);
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
    return ts.parseJsonConfigFileContent(config.config, ts.sys, repository).options;
}

/** Runtime module specifiers of one file. */
export function runtimeSpecifiers(file: string): string[] {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const found: string[] = [];
    const literal = (node: ts.Expression | undefined) => {
        if (!node || !ts.isStringLiteralLike(node)) throw new Error(`${file}: a module specifier that is not a string literal`);
        return node.text;
    };
    const visit = (node: ts.Node) => {
        if (ts.isImportDeclaration(node)) {
            const clause = node.importClause, named = clause?.namedBindings;
            const erased = clause?.isTypeOnly || (!!clause && !clause.name && !!named && ts.isNamedImports(named) && named.elements.length > 0 && named.elements.every(element => element.isTypeOnly));
            if (!erased) found.push(literal(node.moduleSpecifier));
        } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
            const clause = node.exportClause;
            const erased = node.isTypeOnly || (!!clause && ts.isNamedExports(clause) && clause.elements.length > 0 && clause.elements.every(element => element.isTypeOnly));
            if (!erased) found.push(literal(node.moduleSpecifier));
        } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
            if (!node.isTypeOnly) found.push(literal(node.moduleReference.expression));
        } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
            found.push(literal(node.arguments[0]));
        } else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require') {
            found.push(literal(node.arguments[0]));
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return found;
}

export interface Closure { files: string[]; packages: string[] }

/**
 * The runtime closure of the given entries, as paths relative to the repository when inside it.
 * A file in `stopAt` is listed when reached but not walked into: what it loads is left out.
 */
export function runtimeClosure(entries: string[], root = repository, stopAt: readonly string[] = []): Closure {
    const options = compilerOptions(), files = new Set<string>(), packages = new Set<string>(), stops = new Set(stopAt.map(file => resolve(root, file)));
    const pending = entries.map(entry => resolve(root, entry));
    while (pending.length) {
        const file = pending.pop()!;
        if (files.has(file)) continue;
        files.add(file);
        if (stops.has(file)) continue;
        for (const specifier of runtimeSpecifiers(file)) {
            if (specifier.startsWith('node:')) continue;
            if (!specifier.startsWith('.')) {
                // A package: it must resolve to a file Node can load; its own imports are not ours to check.
                createRequire(file).resolve(specifier);
                packages.add(specifier);
                continue;
            }
            const resolved = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule;
            if (!resolved || resolved.isExternalLibraryImport || resolved.extension === ts.Extension.Dts)
                throw new Error(`${file}: ${specifier} does not resolve to a source file`);
            pending.push(resolve(dirname(file), resolved.resolvedFileName));
        }
    }
    const relative = (file: string) => file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;
    return { files: [...files].map(relative).sort(), packages: [...packages].sort() };
}
