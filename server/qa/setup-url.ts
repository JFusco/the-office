/**
 * True when a browser observation was made in the application a QA report's setup names: on the
 * setup URL's origin, at or under its path. The setup names where testing happened; the pages
 * observed are inside it and need not repeat it.
 */
export function underSetupUrl(observed: string, setup: string): boolean {
    try {
        const at = new URL(observed), base = new URL(setup);
        return at.origin === base.origin && `${at.pathname}/`.startsWith(`${base.pathname.replace(/\/+$/, '')}/`);
    }
    catch { return false; }
}
