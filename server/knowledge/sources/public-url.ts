/** Allowlist policy for registered public sources and the links found on their pages. */
export function publicUrl(raw: string, hosts: string[]): string | undefined {
    try {
        const url = new URL(raw);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.port || !hosts.includes(url.hostname) || !url.hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal|test)$/.test(url.hostname) || /^\d[\d.]*$/.test(url.hostname) || url.hostname.includes(':')) return;
        return url.href;
    } catch { return; }
}
