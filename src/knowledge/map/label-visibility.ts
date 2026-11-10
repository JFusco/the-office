export interface LabelRectangle { id: string; priority: number; x: number; y: number; width: number; height: number }
/** Stable screen-space collision selection; hover/keyboard focus takes precedence over selection. */
export function visibleLabels(rectangles: LabelRectangle[], width: number, height: number, limit = 12): Set<string> {
    const accepted: LabelRectangle[] = [], result = new Set<string>();
    if (limit <= 0) return result;
    for (const label of [...rectangles].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))) {
        if (label.x + label.width < 0 || label.x > width || label.y + label.height < 0 || label.y > height) continue;
        if (accepted.some(other => label.x < other.x + other.width + 8 && label.x + label.width + 8 > other.x && label.y < other.y + other.height + 4 && label.y + label.height + 4 > other.y)) continue;
        accepted.push(label); result.add(label.id);
        if (accepted.length >= limit) break;
    }
    return result;
}
