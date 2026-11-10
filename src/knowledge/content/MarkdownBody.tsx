import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const typography = [
    'text-13 leading-relaxed text-ink wrap-anywhere',
    '[&_h3]:font-heading [&_h3]:font-emphasis [&_h3]:text-18 [&_h3]:mt-section-gap [&_h3]:mb-3',
    '[&_h4]:font-heading [&_h4]:font-emphasis [&_h4]:text-15 [&_h4]:mt-section-gap [&_h4]:mb-2',
    '[&_h5]:font-emphasis [&_h5]:mt-4 [&_h5]:mb-2 [&_h6]:font-emphasis',
    '[&_p]:my-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-2',
    '[&_a]:text-link [&_a]:underline [&_a]:underline-offset-3 [&_a]:break-words',
    '[&_blockquote]:border-l-2 [&_blockquote]:border-drawer-line [&_blockquote]:pl-4 [&_blockquote]:text-muted',
    '[&_code]:font-mono [&_code]:text-12 [&_code]:bg-roster-hover [&_code]:rounded-3 [&_code]:px-1',
    '[&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_pre]:rounded-7 [&_pre]:bg-roster-hover [&_pre]:p-4 [&_pre_code]:p-0',
    '[&_table]:w-full [&_th]:text-left [&_th]:font-emphasis [&_th]:p-2 [&_td]:p-2',
    '[&_th]:border-b [&_td]:border-b [&_th]:border-drawer-line [&_td]:border-drawer-line',
    '[&_hr]:my-section-gap [&_hr]:border-drawer-line [&_input]:mr-2',
].join(' ');

export function readableHref(href: string, baseUrl?: string): string | undefined {
    try {
        const url = baseUrl ? new URL(href, baseUrl) : new URL(href);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
    } catch { return; }
}
/** Source HTML and remote image loads are disabled; document links use their committed base. */
export function MarkdownBody({ text, baseUrl }: { text: string; baseUrl?: string }) {
    return <div className={typography} data-knowledge-markdown>
        <Markdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={url => readableHref(url, baseUrl) || ''} components={{
            h1: ({ children }) => <h3>{children}</h3>,
            h2: ({ children }) => <h4>{children}</h4>,
            h3: ({ children }) => <h5>{children}</h5>,
            h4: ({ children }) => <h6>{children}</h6>,
            a: ({ href, children }) => href ? <a href={href} target="_blank" rel="noreferrer">{children}</a> : <span>{children}</span>,
            img: ({ alt }) => <span className="text-muted">{alt ? `Image: ${alt}` : 'Image omitted from text view'}</span>,
            input: ({ checked }) => <input type="checkbox" disabled checked={!!checked} aria-label={checked ? 'Completed task' : 'Incomplete task'}/>,
            table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
        }}>{text}</Markdown>
    </div>;
}
