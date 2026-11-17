const HEADER = /^([a-z][a-z-]*) · [a-z]+ · (\d{4}-\d\d-\d\dT[\d:.]+Z) · sha256 [0-9a-f]+\s+(?=[{"])/;

/** A JSON string read from text that may be cut off mid-way, starting just after its opening quote. */
function jsonString(text: string, from: number): string {
    let raw = '';
    for (let i = from; i < text.length && text[i] !== '"'; i++) raw += text[i] === '\\' ? text[i] + (text[++i] ?? '') : text[i];
    for (; raw; raw = raw.slice(0, -1)) try { return JSON.parse(`"${raw}"`) as string; } catch { /* a cut-off escape: drop a character and try again */ }
    return '';
}
const field = (text: string, name: string) => { const start = text.indexOf(`"${name}":"`); return start < 0 ? '' : jsonString(text, start + name.length + 4); };

/** The opening of worker prose: no headings or markup, long hashes shortened, at most two sentences. */
function opening(prose: string): string {
    const first = prose.split(/\n\s*\n/).map(paragraph => paragraph.split('\n').filter(line => !/^\s*#{1,6}\s/.test(line)).join(' ').replace(/`|\*\*/g, '').replace(/^\s*[-*]\s+/, '')
        .replace(/\b([0-9a-f]{7})[0-9a-f]{33,}\b/g, '$1').replace(/\s+/g, ' ').trim()).find(Boolean) || '';
    const sentences = first.split(/(?<=[.!?])(?<!\b(?:e\.g|i\.e|vs|etc|cf|approx)\.)\s+/).slice(0, 2).join(' ');
    return sentences.length <= 320 ? sentences : `${sentences.slice(0, 319).replace(/\s+\S*$/, '')}…`;
}

/**
 * One stored piece of lesson evidence as a person reads it. Evidence saved from a stage result is kept as a
 * header line and a raw result excerpt for Harper; that becomes a short heading and the opening of what the
 * result says. Anything else, or a result with nothing readable in it, is shown as it is.
 */
export function evidenceText(detail: string, timeZone?: string): { heading: string; text: string } {
    const header = detail.match(HEADER), at = header ? new Date(header[2]) : null;
    if (!header || !at || Number.isNaN(at.getTime())) return { heading: '', text: detail };
    const body = detail.slice(header[0].length);
    // A recovery record carries no prose, only how it was left.
    const left = [field(body, 'disposition'), field(body, 'status')].filter(Boolean).map(word => word.replace(/-/g, ' '));
    const text = opening(body.startsWith('"') ? jsonString(body, 1) : field(body, 'summary') || field(body, 'detail') || field(body, 'blocker'))
        || (left.length ? `${left[0].replace(/^./, letter => letter.toUpperCase())}${left[1] ? ` (${left[1]})` : ''}.` : '');
    if (!text) return { heading: '', text: detail };
    const outcome = body.startsWith('{') ? body.match(/"outcome":"([a-z]+)"/)?.[1] || '' : '';
    const stage = header[1].replace(/-/g, ' ').replace(/^./, letter => letter.toUpperCase());
    const when = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone }).format(at);
    return { heading: [stage, outcome, when].filter(Boolean).join(' · '), text };
}
