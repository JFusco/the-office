import { parseDocument } from 'yaml';

export interface DocumentMetadata {
    title?: string;
    domain?: string;
    reviewed_at?: string;
    evidence_date?: string;
    status?: string;
    versions?: string[];
    applicability?: string;
    provenance?: string;
}
export interface KnowledgeDocumentText {
    body: string;
    metadata: DocumentMetadata;
    frontmatter: 'none' | 'parsed' | 'incomplete' | 'invalid';
}
/** A reading projection only. Original text and its identity are never rewritten. */
export function documentText(text: string): KnowledgeDocumentText {
    const plain = { body: text, metadata: {}, frontmatter: 'none' as const };
    const opening = /^\uFEFF?---\r?\n/.exec(text);
    if (!opening || !/^[a-zA-Z_][\w-]*\s*:/.test(text.slice(opening[0].length).trimStart())) return plain;
    const ending = /^(?:---|\.\.\.)[ \t]*\r?$/gm;
    ending.lastIndex = opening[0].length;
    const close = ending.exec(text);
    if (!close) return { body: '', metadata: {}, frontmatter: 'incomplete' };
    if (close.index > 16384) return { body: text, metadata: {}, frontmatter: 'invalid' };
    try {
        const document = parseDocument(text.slice(opening[0].length, close.index), { strict: true, uniqueKeys: true, prettyErrors: false });
        if (document.errors.length) throw Error('Invalid frontmatter');
        const value: unknown = document.toJS({ maxAliasCount: 0 });
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid frontmatter');
        const metadata: DocumentMetadata = {}, fields = value as Record<string, unknown>;
        for (const key of ['title', 'domain', 'reviewed_at', 'evidence_date', 'status', 'applicability', 'provenance'] as const) {
            if (Object.hasOwn(fields, key) && typeof fields[key] === 'string') metadata[key] = fields[key].slice(0, 2000);
        }
        if (Array.isArray(fields.versions)) metadata.versions = fields.versions.filter((v): v is string => typeof v === 'string').slice(0, 30).map(v => v.slice(0, 100));
        return { body: text.slice(close.index + close[0].length).replace(/^\r?\n/, ''), metadata, frontmatter: 'parsed' };
    } catch {
        return { body: text, metadata: {}, frontmatter: 'invalid' };
    }
}
