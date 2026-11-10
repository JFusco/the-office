let cached: {gap:number;minimum:number}|undefined;
/** Resolve fixed map spacing once; cache only a complete, successful token read. */
export function knowledgeLayout() {
    if(cached)return cached;
    const css = getComputedStyle(document.documentElement);
    const read = (name: string) => {
        const value = parseFloat(css.getPropertyValue(name));
        if (!Number.isFinite(value) || value <= 0) throw Error(`Knowledge layout token ${name} is not defined`);
        return value;
    };
    const resolved={ gap: read('--spacing-card-padding'), minimum: read('--spacing-map-label-min') };
    cached=resolved;return resolved;
}
