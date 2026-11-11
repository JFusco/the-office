import { documentText } from '../../../src/knowledge/content/document';

/** The advice a worker can act on; a note opens with applicability, which a short briefing would otherwise spend its space on. */
const ACTION = /^## What to do[ \t]*\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m;

/** Deterministic excerpts from committed guidance, before the existing response/briefing bounds. */
export function guidanceExcerpt(text: string, limit = 1000): string {
    const document = documentText(text);
    if (document.frontmatter === 'incomplete' || document.frontmatter === 'invalid') return '';
    const body = document.body.trimStart().replace(/^# [^\r\n]+\r?\n+/, '').trim();
    return (ACTION.exec(body)?.[1].trim() || body).slice(0, limit);
}
