import { lazy, Suspense } from 'react';

// The Markdown renderer is loaded with the first team message, not with the app.
const ChatMarkdown = lazy(() => import('./ChatMarkdown'));
const plain = 'my-2 text-13 leading-body whitespace-pre-wrap';

/**
 * The text of one chat message. The team writes Markdown, so its messages are rendered with the Office's
 * own renderer (no images, only web links, source HTML shown as text); what a person typed is shown exactly
 * as typed. Until the renderer has loaded, the message reads as plain text.
 */
export function MessageText({ body, team }: { body: string; team: boolean }) {
  if (!team) return <p className={plain}>{body}</p>;
  return <Suspense fallback={<p className={plain}>{body}</p>}><ChatMarkdown text={body}/></Suspense>;
}
