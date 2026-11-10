import { documentText } from '../../../src/knowledge/content/document';

/** A bounded reading label from admitted evidence; persisted identities stay untouched. */
export function evidenceTitle(text: string, sourceTitle: string): string {
    const document = documentText(text);
    const candidate = document.frontmatter === 'invalid' || document.frontmatter === 'incomplete' ? ''
        : document.metadata.title?.trim() || document.body.trimStart().split(/\r?\n/, 1)[0];
    const plain = candidate.replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, '$1')
        .replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
    const excerpt = Array.from(plain);
    return `${sourceTitle} · ${excerpt.length ? excerpt.slice(0, 96).join('') + (excerpt.length > 96 ? '…' : '') : 'Source evidence'}`;
}
