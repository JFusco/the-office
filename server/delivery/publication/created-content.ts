import { digest } from '../../store/readback-evidence';

/**
 * The digest of what one original `gh pr create` published: only when the URL it printed is the linked draft
 * read back, and that draft shows exactly the title and body supplied. An adopted pull request, a mismatched
 * read-back and one only observed after a lost response confer nothing.
 */
export function createdContentSha256(printed: string, readBack: { url?: unknown; title?: unknown; body?: unknown } | null, content: { title: string; body: string }): string | undefined {
    if (!readBack || printed.trim() !== readBack.url || readBack.title !== content.title || readBack.body !== content.body) return undefined;
    return digest({ title: content.title, body: content.body });
}
