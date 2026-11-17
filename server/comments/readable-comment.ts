import { storedWords } from './stored-words';

/** One comment the Office leaves on a ticket, issue or pull request, in the same shape everywhere. */
export interface ReadableComment {
    /** What happened, in a few words. */
    headline: string;
    /** Short plain paragraphs. */
    paragraphs: string[];
    /** What is needed next and from whom, when something is. */
    needed?: string;
    points?: { title: string; items: string[] };
    links?: { label: string; url: string }[];
    /** Internal identifiers the harness and operators look up; kept to one closing line. */
    reference: string;
}

const blocks = (comment: ReadableComment): string[][] => [
    [comment.headline], ...comment.paragraphs.filter(Boolean).map(paragraph => [paragraph]),
    ...(comment.needed ? [[`What's needed:`, comment.needed]] : []),
    ...(comment.points?.items.length ? [[comment.points.title, ...comment.points.items]] : []),
    ...(comment.links?.length ? [['Links', ...comment.links.map(link => link.label)]] : []),
    [comment.reference]];

/** Markdown for Jira and GitHub. */
export function commentMarkdown(comment: ReadableComment): string {
    // Nothing in a sentence may start a list, a heading, a table, emphasis or a character entity of its own.
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/([\\*_`\[\]<>~|#])/g, '\\$1').replace(/^(\d+)\. /, '$1\\. ').replace(/^([-+]) /, '\\$1 ');
    const href = (url: string) => url.replace(/[\s()<>]/g, character => encodeURIComponent(character).replace(/\(/g, '%28').replace(/\)/g, '%29'));
    return [`**${escape(comment.headline)}**`, ...comment.paragraphs.filter(Boolean).map(escape),
        ...(comment.needed ? [`**What's needed:** ${escape(comment.needed)}`] : []),
        ...(comment.points?.items.length ? [`**${escape(comment.points.title)}**\n${comment.points.items.map(item => `- ${escape(item)}`).join('\n')}`] : []),
        ...(comment.links?.length ? [`**Links**\n${comment.links.map(link => `- [${escape(link.label)}](${href(link.url)})`).join('\n')}`] : []),
        escape(comment.reference)].join('\n\n');
}

/** The words a reader sees, in the form `storedWords` gives for the provider's saved comment. */
export function commentWords(comment: ReadableComment): string {
    return storedWords(blocks(comment).flat().join(' '));
}

/** The words of markdown this module rendered earlier, for a comment recorded before its source changed. */
export function markdownWords(markdown: string): string {
    return markdown.replace(/(?<!\\)\[((?:\\.|[^\]\\])+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/^- /gm, '').replace(/\\(.)/g, '$1').replace(/&amp;/g, '&');
}
