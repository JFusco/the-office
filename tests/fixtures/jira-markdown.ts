/** How Jira stores a markdown comment: a document of paragraphs and lists, with the markup gone and character entities decoded. */
export function jiraDocument(markdown: string) {
    const text = (line: string) => ({ type: 'paragraph', content: [{ type: 'text', text: line.replace(/(?<!\\)\[((?:\\.|[^\]\\])+)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/\\(.)/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') }] });
    return { type: 'doc', version: 1, content: markdown.split(/\n{2,}/).flatMap(block => {
        const lines = block.split('\n'), items = lines.filter(line => line.startsWith('- '));
        return [...lines.filter(line => !line.startsWith('- ')).map(text), ...(items.length ? [{ type: 'bulletList', content: items.map(item => ({ type: 'listItem', content: [text(item.slice(2))] })) }] : [])];
    }) };
}
