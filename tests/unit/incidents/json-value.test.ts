import { expect, test } from 'vitest';
import { JsonLayers } from '../../../server/incidents/json-layers';
import { nonStringValueEnd } from '../../../server/incidents/json-value';

const end = (text: string, start: string) => {
    const at = text.indexOf(start);
    const value = nonStringValueEnd(text, new JsonLayers(text), at);
    return value === null ? null : text.slice(at, value);
};

test('a scalar is read whole: sign, fraction and exponent, or a literal that is not the start of a word', () => {
    expect(end('{"k":-1.5e+10,"n":1}', '-1.5')).toBe('-1.5e+10');
    expect(end('{"k":true,"n":1}', 'true')).toBe('true');
    expect(end('{"k":nullable}', 'nullable')).toBeNull();
});

test('a container ends at its matching bracket, and brackets inside a string of either quote are data', () => {
    expect(end('{"k":{"a":"}","b":[1,"]"]},"n":1}', '{"a"')).toBe('{"a":"}","b":[1,"]"]}');
    expect(end("{'k':{'a':'}x'},'n':1}", "{'a'")).toBe("{'a':'}x'}");
    expect(end('{"k":{"a":"it\'s }"},"n":1}', '{"a"')).toBe('{"a":"it\'s }"}');
});

test('inside a JSON string the value is read decoded, and a cut container ends with the string holding it', () => {
    const wrapped = JSON.stringify({ d: '{"k":{"a":"x (cut)', n: 1 });
    const at = wrapped.indexOf('{' + '\\"a');
    expect(wrapped.slice(at, nonStringValueEnd(wrapped, new JsonLayers(wrapped), at)!)).toBe('{\\"a\\":\\"x (cut)');
});

test('a quoted or missing value is not this rule\'s', () => {
    expect(end('{"k":"x"}', '"x"')).toBeNull();
    expect(end('{"k": oops}', 'oops')).toBeNull();
});
