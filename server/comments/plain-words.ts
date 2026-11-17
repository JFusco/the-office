const LOCAL = /(?:^|[\s("'=])(?:~\/|file:\/\/|\.local\/|\/(?:Users|home|private|tmp|var|opt|Volumes)\/)|(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+|\/|\b)/;
const tidy = (part: string) => part.split(' ').map(word => /^https?:\/\//.test(word) ? word : word.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '').replace(/\b([0-9a-f]{7})[0-9a-f]{33,}\b/gi, '$1')).join(' ')
    .replace(/\s+/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();

/**
 * Model-written text made fit for a ticket comment: no sentences about local files or previews, no long
 * hashes, run ids or markup, and no more than a few sentences. Deterministic: the same text always gives the same result.
 */
export function plainWords(text: string, sentences: number, max = 480): string {
    const unmarked = String(text || '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_all, label, url) => LOCAL.test(` ${url}`) ? url : label).replace(/`|\*\*|^\s*(?:#{1,6}|>)\s+/gm, '').replace(/\s+/g, ' ').trim();
    const all = unmarked.split(/(?<=[.!?])(?<!\b(?:e\.g|i\.e|vs|etc|cf|approx|\d)\.)\s+/).filter(Boolean);
    // A sentence that points at a file on the Office machine or a local preview says nothing to a ticket reader.
    const remote = all.filter(part => !LOCAL.test(part));
    // If every sentence did, keep what they say and name the place generically rather than say nothing.
    const parts = (remote.length ? remote : all.map(part => part.split(' ').map(word => LOCAL.test(` ${word}`) ? `a local file${/[.!?]$/.test(word) ? word.slice(-1) : ''}` : word).join(' '))).map(tidy).filter(Boolean);
    let out = '';
    for (const part of parts.slice(0, sentences)) {
        if (out && out.length + part.length + 1 > max) break;
        out = out ? `${out} ${part}` : part;
    }
    if (out.length <= max) return out;
    const cut = out.slice(0, max - 1), space = cut.lastIndexOf(' ');
    return `${cut.slice(0, space > max / 2 ? space : cut.length).replace(/[\s,;:]+$/, '').replace(/[\ud800-\udbff]$/, '')}…`;
}
