export interface CommentPage { data: any; pageInfo?: any }

/** Verify one provider comment, retaining native v2 pagination metadata. */
export async function commentReadback(id: string, account: string, text: string,
    read: (after: string) => Promise<CommentPage>, plain: (value: unknown) => string): Promise<boolean> {
    let after = '';
    const seen = new Set<string>();
    for (let count = 0; count < 10; count++) {
        const response = await read(after);
        const page = response.data.comments || response.data;
        const nodes = Array.isArray(page) ? page : page.nodes || page.edges?.map((edge: any) => edge.node);
        const info = page.pageInfo || response.pageInfo;
        if (!Array.isArray(nodes) || typeof info?.hasNextPage !== 'boolean') return false;
        const saved = nodes.find((comment: any) => String(comment.id) === String(id));
        if (saved) return saved.author?.accountId === account && plain(saved.body) === text;
        if (!info.hasNextPage) return false;
        const next = info.endCursor || info.nextCursor;
        if (typeof next !== 'string' || !next || seen.has(next)) return false;
        seen.add(next);
        after = next;
    }
    return false;
}
