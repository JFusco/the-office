import type { BrowserPage } from './browser-pages';
import type { SignInWait } from './sign-in-wait';

/** `gone`: the browser no longer answers. `waiting`: it does, and the sign-in is not seen as done. */
export type SignInState = 'signed-in' | 'waiting' | 'gone';

const web = (url: string): URL | undefined => {
    try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed : undefined; }
    catch { return undefined; }
};

/**
 * Whether the window a QA worker left for sign-in has been signed in to, from its tab URLs alone. Signed
 * in means a tab is in the application and no tab is still on the sign-in page. When the sign-in page is
 * on another host (an identity provider), any tab still on that host is still signing in; a step on a
 * third host is neither, so the wait continues. When the application serves its own sign-in page, that
 * page's path and anything under it count as the sign-in page.
 */
export function signInState(pages: readonly BrowserPage[] | null, wait: SignInWait): SignInState {
    if (!pages) return 'gone';
    const signIn = new URL(wait.signInUrl), app = new URL(wait.appUrl);
    const tabs = pages.map(page => web(page.url)).filter((tab): tab is URL => !!tab);
    const base = signIn.pathname.replace(/\/+$/, '');
    const onSignIn = (tab: URL) => tab.origin === signIn.origin && (signIn.origin !== app.origin || `${tab.pathname}/`.startsWith(`${base}/`));
    if (tabs.some(onSignIn)) return 'waiting';
    return tabs.some(tab => tab.origin === app.origin) ? 'signed-in' : 'waiting';
}
