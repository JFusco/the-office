/** Reject provider errors before interpreting a native Jira response. */
export function unpack(raw: string) {
    const result = JSON.parse(raw);
    if (result.error || result.ok === false || !result.data)
        throw new Error('Jira operation returned no verified result');
    return result.data;
}
