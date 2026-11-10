import { documentText } from '../../../src/knowledge/content/document';

/** A bounded reading label from admitted evidence; persisted identities stay untouched. */
export function evidenceTitle(text: string, sourceTitle: string, publicClaims = false): string {
    if (publicClaims) {
        try {
            const claims: unknown = JSON.parse(text);
            text = Array.isArray(claims) ? claims.find(claim => claim && typeof claim.claim === 'string' && claim.claim.trim())?.claim || '' : '';
        } catch { text = ''; }
    }
    const document = documentText(text);
    const candidate = document.frontmatter === 'invalid' || document.frontmatter === 'incomplete' ? ''
        : document.metadata.title?.trim() || document.body.trimStart().split(/\r?\n/, 1)[0];
    const plain = candidate.replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, '$1')
        .replace(/(`+)(.*?)\1|(?<!\w)(\*\*|\*)(?=\S)(.+?\S|\S)\3(?!\w)/g, (_match, ticks, code, _emphasis, words) => ticks ? code : words)
        .replace(/\s+/g, ' ').trim();
    const excerpt = Array.from(plain);
    return `${sourceTitle} · ${excerpt.length ? excerpt.slice(0, 96).join('') + (excerpt.length > 96 ? '…' : '') : 'Source evidence'}`;
}
