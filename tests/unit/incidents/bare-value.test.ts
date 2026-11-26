import { expect, test } from 'vitest';
import { bareValue, deeperValueEnd, queryValue, separatorEscapeAt } from '../../../server/incidents/bare-value';
import { JsonLayers } from '../../../server/incidents/json-layers';

const B = '\\';
const value = (text: string, start: string, read = bareValue) => {
    const at = text.indexOf(start) + start.length;
    const found = read(text, new JsonLayers(text), at, text.length);
    return found && { value: text.slice(at, found.end), endsAtEscape: found.endsAtEscape };
};

test('in plain text a written space ends the value, and a printable escape or literal backslash stays in it', () => {
    expect(value('token=fixture' + B + 'u0020next', 'token=')).toEqual({ value: 'fixture', endsAtEscape: true });
    expect(value('token=fix' + B + 'u00e4ture next', 'token=')).toEqual({ value: 'fix' + B + 'u00e4ture', endsAtEscape: false });
    expect(value('token=a' + B + 'Ub next', 'token=')).toEqual({ value: 'a' + B + 'Ub', endsAtEscape: false });
});

test('a leading separator escape and its indentation belong to the value', () => {
    expect(value(JSON.stringify({ m: 'token=\n  fixture done' }), 'token=')?.value).toBe(B + 'n  fixture');
});

test('inside a JSON string only an escape at that string\'s depth separates', () => {
    const once = JSON.stringify({ m: 'token=fix' + B + 'u0020tail next' });
    expect(value(once, 'token=')?.value).toBe('fix' + B + B + 'u0020tail');
    const twice = JSON.stringify({ d: '{"m":"token=fix' + B + 'u0020tail next"}' });
    expect(value(twice, 'token=')).toEqual({ value: 'fix', endsAtEscape: true });
});

test('a query value keeps its escape pairs, an escaped ampersand among them, up to a written separator', () => {
    expect(value('?token=a' + B + '&b=2' + B + 'u0020tail', '?token=', queryValue)).toEqual({ value: 'a' + B + '&b=2', endsAtEscape: true });
    expect(value('?token=a&b', '?token=', queryValue)).toEqual({ value: 'a', endsAtEscape: false });
});

test('a separator escape is measured at the depth of the text holding it', () => {
    const text = 'x' + B + 'u0020y';
    expect(separatorEscapeAt(text, new JsonLayers(text), 1)).toBe(6);
    const json = JSON.stringify({ m: 'x' + B + 'u0020y' });
    expect(separatorEscapeAt(json, new JsonLayers(json), json.indexOf(B))).toBe(0);
});

test('in a string the text never closes, a value may also start one depth further in', () => {
    const text = JSON.stringify({ d: JSON.stringify({ m: 'token=\n  fixture done' }).slice(0, -2), n: 1 });
    const at = text.indexOf('token=') + 'token='.length;
    const end = deeperValueEnd(text, new JsonLayers(text), at, text.length, () => false);
    expect(text.slice(at, end)).toBe(B + B + 'n  fixture');
    expect(deeperValueEnd(text, new JsonLayers(text), at, text.length, () => true)).toBe(-1);
});
