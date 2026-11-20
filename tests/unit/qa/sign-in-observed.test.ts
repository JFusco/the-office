import { expect, test } from 'vitest';
import { signInState } from '../../../server/qa/sign-in-observed';

const idp = { port: 9222, signInUrl: 'https://login.example.test/tenant/oauth2/authorize?client_id=x', appUrl: 'https://app.example.test/projects' };
const own = { port: 9222, signInUrl: 'https://app.example.test/login?next=%2F', appUrl: 'https://app.example.test/' };
const pages = (...urls: string[]) => urls.map(url => ({ url }));

test('a browser that does not answer is gone', () => expect(signInState(null, idp)).toBe('gone'));

test.each([
    ['the tab is still on the identity provider', pages('https://login.example.test/tenant/oauth2/authorize?client_id=x')],
    ['the tab moved to another page of the identity provider', pages('https://login.example.test/common/mfa')],
    ['the tab is on a third host between the two', pages('https://mfa.other.test/verify')],
    ['one tab reached the application while another is still signing in', pages('https://app.example.test/projects', 'https://login.example.test/kmsi')],
    ['only browser pages are open', pages('chrome://newtab/', 'about:blank')],
    ['no tab is open', pages()],
    ['a look-alike host is open', pages('https://app.example.test.evil.test/projects')],
])('still waiting when %s', (_name, open) => expect(signInState(open, idp)).toBe('waiting'));

test('signed in when a tab is in the application and none is on the identity provider', () => {
    expect(signInState(pages('chrome://newtab/', 'https://app.example.test/projects/p1?tab=spec'), idp)).toBe('signed-in');
});

test('an application that serves its own sign-in page: only that page is the sign-in page', () => {
    expect(signInState(pages('https://app.example.test/login?next=%2Fprojects'), own)).toBe('waiting');
    expect(signInState(pages('https://app.example.test/projects'), own)).toBe('signed-in');
    expect(signInState(pages('https://app.example.test/projects', 'https://app.example.test/login'), own)).toBe('waiting');
});
