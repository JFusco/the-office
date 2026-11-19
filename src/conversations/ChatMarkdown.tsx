import { MarkdownBody } from '../knowledge/content/MarkdownBody';

// A chat message keeps its own line breaks, shows angle-bracket text as written, and sits flush in its bubble.
const bubble = 'my-2 [&_p]:whitespace-pre-line [&_li]:whitespace-pre-line [&>div>:first-child]:mt-0 [&>div>:last-child]:mb-0';

/** A team chat message as formatted text. Loaded on demand by `MessageText`. */
export default function ChatMarkdown({ text }: { text: string }) {
  return <div className={bubble} data-chat-markdown><MarkdownBody text={text} sourceHtml="text"/></div>;
}
