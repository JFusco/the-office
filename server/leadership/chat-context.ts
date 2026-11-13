/** Chat is an index into owning records, not an export of every provider/history payload. */
export function boundedCTOContext(context: unknown) {
    const source = context && typeof context === 'object' ? context as Record<string, unknown> : {};
    let omitted = 0;
    function project(value: unknown, width: number, text: number, depth = 0): unknown {
        if (typeof value === 'string') {
            if (value.length <= text) return value;
            omitted++;
            return value.slice(0, text) + `… [${value.length - text} characters omitted]`;
        }
        if (value === null || typeof value !== 'object') return value;
        if (depth === 8) { omitted++; return '[Nested evidence omitted]'; }
        if (Array.isArray(value)) {
            const items = value.slice(0, width).map(item => project(item, width, text, depth + 1));
            if (value.length <= width) return items;
            omitted += value.length - width;
            return { items, omittedItems: value.length - width };
        }
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, project(item, width, text, depth + 1)]));
    }
    const projects = Array.isArray(source.projects) ? source.projects as Record<string, unknown>[] : [];
    // Keep canonical goal identity/version separate from the size-limited evidence. No raw provider duplication.
    const directory = projects.map(item => ({ project: item.project,
        goals: Array.isArray(item.goals) ? item.goals.map(({ id, projectId, title, status, updatedAt }: any) => ({ id, projectId, title, status, updatedAt })) : [] }));
    for (const width of [12, 6, 3, 1]) {
        omitted = 0;
        const evidence = project({ ...source, projects: projects.map(item => { if (!item.goalEvidence) return item; const { github: _github, azure: _azure, ...rest } = item; return rest; }) }, width, 1200);
        const result = { directory, evidence, coverage: { omittedSections: omitted, duplicateProviderSnapshotsRemoved: projects.filter(item => item.goalEvidence && (item.github || item.azure)).length,
            instruction: 'This is a bounded read-only index. Omitted evidence is unknown, never acceptance. Read exact owning goal scope/version and source records before relying on omitted text, editing a goal or creating a possibly duplicate goal. History is not authority. The current human message follows separately and is complete.' } };
        if (JSON.stringify(result).length <= 180000) return result;
    }
    // Fail before invoking a model rather than silently discarding the goal directory or human request.
    throw new Error('CTO goal index exceeds the chat context budget; narrow the project or goal before continuing');
}
