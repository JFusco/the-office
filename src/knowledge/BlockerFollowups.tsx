import type { KnowledgeState } from '../shared';
import { Card, Section, SectionTitle, Tag, TextLink, mutedCopy } from '../ui';
/** Current source disposition stays separate from the retained failure history. */
export function BlockerFollowups({ knowledge }: { knowledge?: KnowledgeState }) {
    const followups = knowledge?.followups || [], improvements = knowledge?.improvements || [], briefs = knowledge?.unblockBriefs || {};
    return <Section data-blocker-followups><SectionTitle>Blockers and improvements</SectionTitle>
        <p className={mutedCopy}>Owners verify the original source. A completed request or preventive fix does not prove recovery.</p>
        {followups.map(item => <Card as="article" key={item.id}><strong>{item.key || item.source.id}</strong><Tag>{item.disposition === 'confirmed' ? 'source-verified resolution' : item.disposition}</Tag><p>{item.owner}: {item.nextAction}</p>{briefs[item.id] ? <dl className="grid gap-1 text-12 leading-relaxed" data-unblock-brief><div><dt className="inline font-emphasis">Harper's brief · known </dt><dd className="inline">{briefs[item.id].known}</dd></div><div><dt className="inline font-emphasis">Decision </dt><dd className="inline">{briefs[item.id].decision}</dd></div><div><dt className="inline font-emphasis">Next </dt><dd className="inline">{briefs[item.id].next}</dd></div></dl> : null}<small>Source: {item.source.kind} · {item.source.id}{item.recoveryId ? ` · Recovery: ${item.recoveryId}` : ''}{item.investigationId ? ` · Investigation: ${item.investigationId}` : ''}{item.improvementId ? ` · Improvement: ${item.improvementId}` : ''}</small><details><summary>Original history ({item.history.length})</summary>{item.history.map((entry, index) => <p key={index}>{entry.at} · {entry.disposition} · {entry.detail}</p>)}{item.evidence.map(proof => <p key={proof.ref}>{proof.detail}</p>)}</details></Card>)}
        {improvements.map(item => <Card as="article" key={item.id}><strong>{item.change}</strong><Tag>{item.status}</Tag><p>{item.detail}</p>{item.url && /^https:\/\//.test(item.url) ? <TextLink href={item.url} target="_blank" rel="noreferrer">{item.providerId}</TextLink> : <small>Provider identity not yet verified</small>}</Card>)}
        {!followups.length && !improvements.length ? <p className={mutedCopy}>No tracked blockers or scoped improvement proposals.</p> : null}
    </Section>;
}
