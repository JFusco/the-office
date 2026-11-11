import { FeatureError } from '../features/progression/failure';

function plain(value: any): boolean {
    return value == null || typeof value === 'string' || ['doc', 'paragraph', 'text', 'hardBreak'].includes(value.type) &&
        (!value.marks || value.marks.length === 0) && (!value.attrs || Object.keys(value.attrs).length === 0) &&
        (!value.content || value.content.every(plain));
}

/** Keep rich ADF in the approval preimage, including marks, attributes and media. */
export function descriptionPreimage(value: unknown, text: (value: unknown) => string): unknown {
    return plain(value) ? text(value) : value;
}

/** The approved plan is appended to a rich source document without rewriting its nodes. */
export function publicationDescription(plan: string, expected: any): unknown {
    if (typeof expected !== 'object' || expected === null) return plan;
    if (expected.type !== 'doc' || expected.version !== 1 || !Array.isArray(expected.content))
        throw new FeatureError('unsupported', 'A verified ADF document is required for lossless publication');
    return { ...structuredClone(expected), content: [
        ...structuredClone(expected.content),
        ...plan.split('\n').map(text => ({ type: 'paragraph', ...(text ? { content: [{ type: 'text', text }] } : {}) })),
    ] };
}
