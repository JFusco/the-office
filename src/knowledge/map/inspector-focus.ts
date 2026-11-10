/** Reset the inspector, then reveal the title with the smallest ancestor scroll. */
export function focusInspectorHeading(heading: HTMLHeadingElement | null) {
    if (!heading) return;
    const panel = heading.closest<HTMLElement>('[data-brain-list-frame]');
    if (panel) panel.scrollTop = 0;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
