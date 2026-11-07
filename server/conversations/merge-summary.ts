/** The merged PR's own words: GitHub `title`/`body`, Azure `title`/`description`. */
export interface MergedPR {
    title?: string;
    body?: string;
}

const LIMITS = { title: 120, summary: 280, bullet: 120, bullets: 3 };

/**
 * Slack read-back compares the sent text with the saved text, so keep it plain: no code or bold
 * marks, markdown links reduced to their label, and no broadcast, user or channel mentions.
 */
export function plainSlackText(text: string): string {
    let out = text.replace(/[`*]/g, '').replace(/\[([^\]]+)\]\((?:https?:\/\/[^)\s]+)\)/g, '$1'), previous: string;
    // Drop whole tokens until stable (`<!he<!here>re>`), then any stray bracket: every Slack token needs both.
    do { previous = out; out = out.replace(/<[!@#][^<>]*>/g, ''); } while (out !== previous);
    return out.replace(/[<>]/g, '').replace(/@+(here|channel|everyone)\b/gi, '$1').replace(/\s+/g, ' ').trim();
}

/** Plain text within `max` characters; sanitized again because a cut can end a word in `@here`. */
function clamp(text: string, max: number): string {
    const plain = plainSlackText(text);
    if (plain.length <= max) return plain;
    // Prefer ending on a whole sentence or clause; otherwise cut at a word.
    const cut = plain.slice(0, max - 1), sentence = cut.lastIndexOf('. '), clause = cut.lastIndexOf('; '), space = cut.lastIndexOf(' ');
    if (sentence > max / 2) return plainSlackText(cut.slice(0, sentence + 1));
    if (clause > max / 2) return plainSlackText(cut.slice(0, clause));
    return `${plainSlackText(space > max - 40 ? cut.slice(0, space) : cut)}…`;
}

/** Lines under a `## Name` heading, up to the next heading, without fenced code. */
function section(body: string, name: string): string[] {
    let fenced = false;
    const lines = body.replace(/\r\n/g, '\n').split('\n').filter(line => {
        if (/^\s*(?:```|~~~)/.test(line)) { fenced = !fenced; return false; }
        return !fenced;
    });
    const heading = (line: string) => /^#{1,6}\s/.test(line.trim());
    const start = lines.findIndex(line => heading(line) && line.trim().replace(/^#{1,6}\s*/, '').toLowerCase() === name.toLowerCase());
    if (start < 0) return [];
    const end = lines.findIndex((line, index) => index > start && heading(line));
    return lines.slice(start + 1, end < 0 ? undefined : end);
}

/** First paragraph of `## Summary`, and up to three top-level `## Changes` bullets. */
export function shippedSummary(pr: MergedPR = {}): { title: string; summary: string; changes: string[] } {
    const body = pr.body || '';
    const paragraph: string[] = [];
    for (const line of section(body, 'Summary')) {
        if (line.trim()) paragraph.push(line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''));
        else if (paragraph.length) break;
    }
    const changes = section(body, 'Changes')
        .filter(line => /^(?:[-*+]|\d+\.)\s+/.test(line))
        .map(line => clamp(line.replace(/^(?:[-*+]|\d+\.)\s+(?:\[[ xX]\]\s+)?/, ''), LIMITS.bullet))
        .filter(Boolean)
        .slice(0, LIMITS.bullets);
    return {
        title: clamp(pr.title || '', LIMITS.title),
        summary: clamp(paragraph.join(' '), LIMITS.summary),
        changes,
    };
}
