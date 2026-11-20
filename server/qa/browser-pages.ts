export interface BrowserPage { url: string }
/** The open tabs of the browser on a loopback debugging port, or null when nothing there answers as a browser. */
export type ReadPages = (port: number) => Promise<BrowserPage[] | null>;

/**
 * One read of a local browser's tab list over its debugging port. Loopback only, and only the list:
 * the harness never attaches to the browser, so it reads no page content or cookie and sends no input.
 * A redirect is refused, so the read never leaves the loopback address.
 */
export const browserPages: ReadPages = async port => {
    try {
        const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000), redirect: 'error' });
        if (!response.ok) return null;
        const targets: unknown = await response.json();
        if (!Array.isArray(targets)) return null;
        return targets.filter(target => target?.type === 'page' && typeof target.url === 'string').map(target => ({ url: target.url as string }));
    }
    catch { return null; }
};
