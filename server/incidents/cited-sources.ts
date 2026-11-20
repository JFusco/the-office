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
