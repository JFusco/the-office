import { expect, test } from 'vitest';
import { underSetupUrl } from '../../../server/qa/setup-url';

test.each([
    ['https://app.example.test', 'https://app.example.test'],
    ['https://app.example.test/', 'https://app.example.test'],
    ['https://app.example.test/projects/p1/features/f1?tab=spec', 'https://app.example.test'],
    ['https://app.example.test/shell/projects/p1', 'https://app.example.test/shell/'],
    ['http://127.0.0.1:3000/a#b', 'http://127.0.0.1:3000/a'],
])('%s is inside %s', (observed, setup) => expect(underSetupUrl(observed, setup)).toBe(true));

test.each([
    ['https://other.example.test/projects/p1', 'https://app.example.test'],
    ['http://app.example.test/projects/p1', 'https://app.example.test'],
    ['https://app.example.test:8443/projects/p1', 'https://app.example.test'],
    ['https://app.example.test/shellfish', 'https://app.example.test/shell'],
    ['https://app.example.test/', 'https://app.example.test/shell'],
    ['https://app.example.test.evil.test/', 'https://app.example.test'],
    ['', 'https://app.example.test'],
    ['https://app.example.test/x', ''],
    ['/projects/p1', 'https://app.example.test'],
])('%s is not inside %s', (observed, setup) => expect(underSetupUrl(observed, setup)).toBe(false));
