import type { OfficeConfigSummary } from '../../shared';
import { Button, Card, TextLink, errorText, mutedCopy } from '../../ui';

export type OfficeConfigState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; config: OfficeConfigSummary };
const term = 'text-card-detail', value = 'wrap-anywhere';
const footer = 'Effective configuration in use since startup. Edit office-config.json and restart the Office to change it.';

/** Read-only view of the effective office configuration. */
export function OfficeConfigView({ state, onRetry }: { state: OfficeConfigState; onRetry: () => void }) {
  if (state.status === 'loading') return <p className={mutedCopy} role="status">Loading the Office configuration…</p>;
  if (state.status === 'error') return <div className="grid gap-3"><p className={errorText} role="alert">Office configuration is unavailable: {state.message.replace(/^(?:Error|TypeError):\s*/, '')}</p><Button className="justify-self-start" onClick={onRetry}>Retry</Button></div>;
  const { projects, cec, holds } = state.config;
  return <div className="grid gap-3" data-office-config>
    {projects.map(project => <Card as="article" key={project.id}><strong className="text-11 leading-relaxed">{project.name}</strong>
      <dl className="grid grid-cols-[90px_1fr] gap-2 text-10 leading-relaxed"><dt className={term}>Provider</dt><dd className={value}>{project.provider === 'github' ? 'GitHub' : 'Azure DevOps'}</dd><dt className={term}>Repository</dt><dd className={value}>{project.repository}</dd><dt className={term}>Target</dt><dd className={value}>{project.target}</dd><dt className={term}>Board</dt><dd className={value}>{project.boardName && project.boardUrl && /^https:\/\//.test(project.boardUrl) ? <TextLink href={project.boardUrl} target="_blank" rel="noreferrer">{project.boardName}</TextLink> : project.boardName || 'No board configured'}</dd></dl></Card>)}
    {projects.some(project => project.provider === 'azure') ? <Card as="article"><strong className="text-11 leading-relaxed">Jira / Azure binding</strong><dl className="grid grid-cols-[90px_1fr] gap-2 text-10 leading-relaxed"><dt className={term}>Jira site</dt><dd className={value}>{cec.site}</dd><dt className={term}>Azure</dt><dd className={value}>{cec.organization} · {cec.project}</dd><dt className={term}>Repository</dt><dd className={value}>{cec.repository}</dd><dt className={term}>Target</dt><dd className={value}>{cec.target}</dd></dl></Card> : null}
    <h4 className="text-13 font-semibold">Holds</h4>
    {holds.length ? holds.map(hold => <Card as="article" key={hold.key}><strong className="text-11 leading-relaxed">{hold.key}</strong><p className="leading-body">{hold.reason}</p></Card>) : <p className={mutedCopy}>No holds are configured.</p>}
    <p className="text-11 leading-body text-muted">{footer}</p>
  </div>;
}
