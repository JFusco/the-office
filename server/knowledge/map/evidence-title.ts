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
    // An absent character keeps source text from impersonating a protected code span.
    const used = new Set(candidate), code: string[] = [];
    let point = 0xe000; while (used.has(String.fromCodePoint(point))) point++;
    const marker = String.fromCodePoint(point);
    const protectedText = candidate.replace(/(?<!`)(`+)(?!`)(.*?)(?<!`)\1(?!`)/g,
        (_match, _ticks, text) => `${marker}${code.push(text) - 1}${marker}`);
    const plain = protectedText.replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, '$1')
        .replace(/(?<!\w)(\*\*|\*)(?=\S)(.+?\S|\S)\1(?!\w)/g, '$2')
        .replace(new RegExp(`${marker}(\\d+)${marker}`, 'g'), (_match, index) => code[Number(index)])
        .replace(/\s+/g, ' ').trim();
    const excerpt = Array.from(plain);
    return `${sourceTitle} · ${excerpt.length ? excerpt.slice(0, 96).join('') + (excerpt.length > 96 ? '…' : '') : 'Source evidence'}`;
}
