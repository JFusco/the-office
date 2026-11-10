/** Resolve fixed map spacing once when its renderer starts; never read CSS per frame. */
export function knowledgeLayout() {
    const css = getComputedStyle(document.documentElement);
    const read = (name: string) => {
        const value = parseFloat(css.getPropertyValue(name));
        if (!Number.isFinite(value) || value <= 0) throw Error(`Knowledge layout token ${name} is not defined`);
        return value;
    };
    return { gap: read('--spacing-card-padding'), minimum: read('--spacing-map-label-min') };
}
