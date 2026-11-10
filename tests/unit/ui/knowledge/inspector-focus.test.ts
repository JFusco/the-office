import { expect, test, vi } from 'vitest';
import { focusInspectorHeading } from '../../../../src/knowledge/map/inspector-focus';
test('selection resets the inspector before focusing and minimally revealing its title', () => {
    const panel = { scrollTop: 700 }, focus = vi.fn(() => { expect(panel.scrollTop).toBe(0); }), scrollIntoView = vi.fn();
    const heading = { closest: () => panel, focus, scrollIntoView } as unknown as HTMLHeadingElement;
    focusInspectorHeading(heading);
    expect(panel.scrollTop).toBe(0); expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'instant' });
});
