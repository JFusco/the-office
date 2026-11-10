import type { KnowledgeReference } from '../../contracts/knowledge-retrieval';

export interface SuppliedReference { reference: KnowledgeReference; excerptSha256: string }
export interface SuppliedExcerpt { reference: KnowledgeReference; scope: string; title: string; excerpt: string; citation: string; limitations: string }
async function sha256(text: string) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join('');
}
/** Format only excerpts matching the immutable manifest; embedded packet-like text cannot create cards. */
export async function suppliedEvidence(text: string, selected: readonly SuppliedReference[], hash = sha256): Promise<SuppliedExcerpt[]> {
    const excerpts: SuppliedExcerpt[] = [];
    for (const { reference, excerptSha256 } of selected.slice(0, 8)) {
        const scope = reference.kind === 'brain' ? 'technical' : reference.kind === 'source' ? 'project' : reference.lesson?.scope;
        const citation = reference.kind === 'lesson' && reference.lesson ? `lesson:${reference.lesson.scope}:${reference.lesson.id}@${reference.lesson.revision}` : reference.id;
        if (!scope || !/^[a-f0-9]{64}$/.test(excerptSha256)) continue;
        const marker = `\n[${scope} · ${citation}] `;
        let position = -1, found: SuppliedExcerpt | undefined;
        while (!found && (position = text.indexOf(marker, position + 1)) >= 0) {
            const start = position + marker.length, headingEnd = text.indexOf('\n', start);
            if (headingEnd < 0) break;
            const title = text.slice(start, headingEnd);
            const candidates = text.slice(headingEnd + 1, headingEnd + 1 + 350 + '\nCitation: '.length);
            for (const match of candidates.matchAll(/\nCitation: /g)) {
                const end = headingEnd + 1 + match.index!, excerpt = text.slice(headingEnd + 1, end);
                if (await hash(excerpt) !== excerptSha256) continue;
                const citationStart = end + '\nCitation: '.length, limitsStart = text.indexOf('\nLimitations: ', citationStart);
                if (limitsStart < 0) continue;
                const next = text.indexOf('\n\n[', limitsStart);
                found = { reference, scope, title, excerpt, citation: text.slice(citationStart, limitsStart), limitations: text.slice(limitsStart + '\nLimitations: '.length, next < 0 ? undefined : next) };
                break;
            }
        }
        if (found) excerpts.push(found);
    }
    return excerpts;
}
