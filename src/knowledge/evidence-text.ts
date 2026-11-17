const HEADER = /^([a-z][a-z-]*) · [a-z]+ · (\d{4}-\d\d-\d\dT[\d:.]+Z) · sha256 [0-9a-f]+\s+(?=\{)/;

/** A JSON string value read from text that may be cut off mid-way. */
function stringField(text: string, name: string): string {
    const start = text.indexOf(`"${name}":"`);
    if (start < 0) return '';
    let raw = '';
    for (let i = start + name.length + 4; i < text.length && text[i] !== '"'; i++) raw += text[i] === '\\' ? text[i] + (text[++i] ?? '') : text[i];
    for (; raw; raw = raw.slice(0, -1)) try { return JSON.parse(`"${raw}"`) as string; } catch { /* a cut-off escape: drop a character and try again */ }
    return '';
}

/**
 * One stored piece of lesson evidence as a person reads it. Evidence saved from a stage result is kept as a
 * header line and a raw result excerpt for Harper; that becomes a short heading and the opening of the summary.
 * Anything else is shown as it is.
 */
export function evidenceText(detail: string, timeZone?: string): { heading: string; text: string } {
    const header = detail.match(HEADER);
    if (!header) return { heading: '', text: detail };
    const body = detail.slice(header[0].length), outcome = body.match(/"outcome":"([a-z]+)"/)?.[1] || '';
    const stage = header[1].replace(/-/g, ' ').replace(/^./, letter => letter.toUpperCase());
    const when = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone }).format(new Date(header[2]));
    const opening = stringField(body, 'summary').split(/\n\s*\n/)[0].replace(/`|\*\*/g, '').replace(/\b([0-9a-f]{7})[0-9a-f]{33,}\b/g, '$1').replace(/\s+/g, ' ').trim();
    const sentences = opening.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
    const text = sentences.length <= 320 ? sentences : `${sentences.slice(0, 319).replace(/\s+\S*$/, '')}…`;
    return { heading: [stage, outcome, when].filter(Boolean).join(' · '), text: text || 'No summary was recorded.' };
}
