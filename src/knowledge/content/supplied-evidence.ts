import type { KnowledgeReference } from '../../contracts/knowledge-retrieval';

export interface SuppliedReference { reference: KnowledgeReference; excerptSha256: string }
export interface SuppliedExcerpt { reference: KnowledgeReference; scope: string; title: string; excerpt: string; citation: string; limitations: string }
async function sha256(text: string) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join('');
}
/** Consume the entire packet in manifest order; source text cannot supply another entry's envelope. */
export async function suppliedEvidence(text: string, selected: readonly SuppliedReference[], hash = sha256): Promise<SuppliedExcerpt[]> {
    const headerEnd = text.indexOf('\n\n'), excerpts: SuppliedExcerpt[] = [];
    if (headerEnd < 0 || !text.startsWith('SOURCE EVIDENCE') || text.slice(0, headerEnd).includes('\n') || selected.length > 8) return [];
    let cursor = headerEnd + 2;
    for (const [index, { reference, excerptSha256 }] of selected.entries()) {
        const scope = reference.kind === 'brain' ? 'technical' : reference.lesson?.scope;
        const identity = reference.kind === 'lesson' && reference.lesson ? `lesson:${reference.lesson.scope}:${reference.lesson.id}@${reference.lesson.revision}` : reference.id;
        const marker = `[${scope} · ${identity}] `;
        if (!scope || !/^[a-f0-9]{64}$/.test(excerptSha256) || !text.startsWith(marker, cursor)) return [];
        const start = cursor + marker.length, headingEnd = text.indexOf('\n', start);
        if (headingEnd < 0) return [];
        const bodyStart = headingEnd + 1, candidates = text.slice(bodyStart, bodyStart + 350 + '\nCitation: '.length);
        let entry: SuppliedExcerpt | undefined;
        for (const match of candidates.matchAll(/\nCitation: /g)) {
            const end = bodyStart + match.index!, excerpt = text.slice(bodyStart, end);
            if (await hash(excerpt) !== excerptSha256) continue;
            const citationStart = end + '\nCitation: '.length, citationEnd = text.indexOf('\n', citationStart);
            if (citationEnd < 0 || !text.startsWith('\nLimitations: ', citationEnd)) return [];
            const limitsStart = citationEnd + '\nLimitations: '.length, limitsEnd = text.indexOf('\n', limitsStart);
            if (index === selected.length - 1 ? limitsEnd !== -1 : limitsEnd < 0 || !text.startsWith('\n\n[', limitsEnd)) return [];
            entry = {reference, scope, title:text.slice(start,headingEnd), excerpt, citation:text.slice(citationStart,citationEnd), limitations:text.slice(limitsStart,limitsEnd < 0 ? undefined : limitsEnd)};
            cursor = limitsEnd < 0 ? text.length : limitsEnd + 2;
            break;
        }
        if (!entry) return [];
        excerpts.push(entry);
    }
    return cursor === text.length ? excerpts : [];
}
