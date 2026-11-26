import { expect, test } from 'vitest';
import { decodedIndex, JsonLayers, quoteAt, unresolvedAt } from '../../../server/incidents/json-layers';

const B = '\\';

test('a string in the text is depth 1, and one inside its decoded content is depth 2, with source offsets kept', () => {
    const inner = '{"m":"a' + B + 'u0020b"}';
    const text = JSON.stringify({ d: inner, n: 1 });
    const layers = new JsonLayers(text);
    const m = text.indexOf('a' + B + B + 'u0020b');
    expect(layers.depth(0)).toBe(0);
    expect(layers.depth(text.indexOf('d'))).toBe(1);
    const string = layers.at(m);
    expect(string?.depth).toBe(2);
    // Decoded twice, the written \\u0020 is a space, and each decoded character still knows where it starts.
    expect(string?.decoded).toBe('a b');
    expect(string?.starts[1]).toBe(m + 1);
    expect(string?.starts[2]).toBe(m + 1 + (B + B + 'u0020').length);
    expect(decodedIndex(string!, m + 3)).toBe(1);
});

test('a string pasted into prose is established once its closing quote is found', () => {
    const text = 'before {"token":"x"} after';
    const layers = new JsonLayers(text);
    expect(layers.depth(text.indexOf('x'))).toBe(1);
    expect(layers.depth(text.indexOf('after'))).toBe(0);
});

test('a quote with no closing quote leaves the rest of its parent\'s content unresolved', () => {
    const text = JSON.stringify({ m: 'ok "open token=x' });
    const layers = new JsonLayers(text);
    const string = layers.at(text.indexOf('token'))!;
    expect(string.depth).toBe(1);
    expect(unresolvedAt(string, text.indexOf('token'))).toBe(true);
    expect(unresolvedAt(string, text.indexOf('ok'))).toBe(false);
});

test('a Unicode-written quote or backslash decodes like any other spelling', () => {
    const text = '{"d":"' + B + 'u0022k' + B + 'u0022:' + B + 'u005Cn"}';
    const string = new JsonLayers(text).at(6)!;
    expect(string.decoded).toBe('"k":\\n');
});

test('a double quote at depth d is written with 2^d - 1 backslashes', () => {
    expect([0, 1, 2, 3].map(quoteAt)).toEqual(['"', B + '"', B.repeat(3) + '"', B.repeat(7) + '"']);
});
