/**
 * The visible words of a comment as a provider stored it (text or an Atlassian document), reduced to what
 * survives a provider's own formatting: no layout, no whitespace, plain quotes and dashes.
 */
export function storedWords(value: unknown): string {
    const text = (node: any): string => typeof node === 'string' ? node : node?.type === 'text' ? String(node.text ?? '')
        : node?.type === 'inlineCard' ? String(node.attrs?.url ?? '') : node?.type === 'emoji' ? String(node.attrs?.text ?? node.attrs?.shortName ?? '') : node?.type === 'mention' ? String(node.attrs?.text ?? '')
        : Array.isArray(node?.content) ? node.content.map(text).join(' ') : Array.isArray(node) ? node.map(text).join(' ') : ' ';
    return text(value).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/-{2,}/g, '-').replace(/\s+/g, '');
}
