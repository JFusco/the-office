import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { SourceCitation } from '../../src/contracts/incidents';

/** The content hash of every file of the release this service loaded, by its path in the release. */
export type SourceVersions = ReadonlyMap<string, string>;

/** From the manifest computed once at start-up: what the service actually runs, not what a caller says it runs. */
export const sourceVersions = (manifest: readonly { path: string; hash: string }[]): SourceVersions => new Map(manifest.map(file => [file.path, file.hash]));

export const CitationSchema = z.object({
    path: z.string().min(1).max(300),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    line: z.number().int().min(1).max(1_000_000).optional(),
}).strict();

/** Why a citation does not name code the service runs, or null when it does. */
export function citationFault(citation: SourceCitation, versions: SourceVersions): string | null {
    const running = versions.get(citation.path);
    if (running === undefined) return `${citation.path} is not a file of the running release`;
    return running === citation.sha256 ? null : `${citation.path} is not the version the running release holds`;
}

/** A claimed range of one version of a file: one-based inclusive lines, the line the claim turns on, and the SHA-256 of the lines joined with LF. */
export interface ClaimedRange { startLine: number; endLine: number; decisiveLine: number; excerptSha256: string }
export type ResolvedRange = { ok: true; excerpt: string } | { ok: false; reason: string };

/**
 * Whether a claimed range is really there in these bytes. Opt-in: the dismissal path keeps `citationFault`.
 * The raw bytes must hash to `fileSha256` before any text is read. LF and CRLF both end a line, and a
 * final terminator adds no line. The excerpt is the selected lines joined with LF, with no terminator.
 */
export function resolveRange(bytes: Uint8Array, fileSha256: string, range: ClaimedRange): ResolvedRange {
    if (createHash('sha256').update(bytes).digest('hex') !== fileSha256) return { ok: false, reason: 'the bytes are not that version of the file' };
    const text = Buffer.from(bytes).toString('utf8'), lines = text === '' ? [] : text.split(/\r\n|\n/);
    if (lines.length && /(\r\n|\n)$/.test(text)) lines.pop();
    const { startLine, endLine, decisiveLine } = range;
    if (!Number.isSafeInteger(startLine) || !Number.isSafeInteger(endLine) || startLine < 1 || endLine < startLine) return { ok: false, reason: 'the range is not one-based and ordered' };
    if (endLine > lines.length) return { ok: false, reason: `the file has ${lines.length} lines, not ${endLine}` };
    if (!Number.isSafeInteger(decisiveLine) || decisiveLine < startLine || decisiveLine > endLine) return { ok: false, reason: 'the decisive line is outside the range' };
    const excerpt = lines.slice(startLine - 1, endLine).join('\n');
    return createHash('sha256').update(excerpt).digest('hex') === range.excerptSha256 ? { ok: true, excerpt } : { ok: false, reason: 'the excerpt does not match the range' };
}
