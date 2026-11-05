import { Fragment } from 'react';

/** A bounded preview, never a replacement for the saved report. */
export function reviewExcerpt(text: string, limit = 280): string {
  const plain = text.replace(/\[([^\]]+)\]\(https?:\/\/[^\s)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+/g, ' ').trim();
  if (plain.length <= limit) return plain;
  const end = plain.lastIndexOf(' ', limit);
  return `${plain.slice(0, end > limit / 2 ? end : limit).trimEnd()}…`;
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
  return <>{parts.map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    if (link) return <a className="underline" key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  })}</>;
}

/** Small supported Markdown subset; source HTML is always rendered as text. */
export function ReviewText({ text, compact = false }: { text: string; compact?: boolean }) {
  if (compact) return <p className="my-2 text-13 leading-relaxed">{reviewExcerpt(text)}</p>;
  return <div className="space-y-3 text-13 leading-relaxed break-words">{text.trim().split(/\n\s*\n/).filter(Boolean).map((block, index) => {
    const lines = block.split('\n');
    return lines.every(line => /^\s*[-*] /.test(line))
      ? <ul className="list-disc space-y-2 pl-5" key={index}>{lines.map((line, i) => <li key={i}><InlineText text={line.replace(/^\s*[-*] /, '')} /></li>)}</ul>
      : <p className="whitespace-pre-line" key={index}><InlineText text={block} /></p>;
  })}</div>;
}
