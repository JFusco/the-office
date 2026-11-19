/**
 * True when a Slack link's visible label stands for the link's own URL: the URL itself, the URL without
 * its scheme, or Slack's shortened form, which keeps the start and the end of the URL around an
 * ellipsis (`dev.azure.com/verndale/…/41448`). Any other label is the author's own text.
 */
export function labelIsUrl(label: string, url: string): boolean {
    const bare = url.replace(/^https?:\/\//, '');
    if (label === url || label === bare) return true;
    const parts = label.split('…');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    return [url, bare].some(form => form.length > parts[0].length + parts[1].length && form.startsWith(parts[0]) && form.endsWith(parts[1]));
}
