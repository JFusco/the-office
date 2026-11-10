import { PanelHeader } from '../ui/PanelHeader';
import { FileText } from '../ui/icons';
import { useEffect, useId, useRef, useState } from 'react';
import type { Feature } from '../contracts/features';
import type { OfficeSnapshot } from '../shared';
import { officeUrl } from '../shared';
import { Button, field, fieldFocus, interactive } from '../ui';
import { FeatureDocuments } from './FeatureDocuments';
import { LinkedFeatures } from './LinkedFeatures';
import { QuestionRound } from './QuestionRound';
const phases = ['discovery', 'plan', 'review', 'approval', 'delivery'] as const;
async function hash(value: unknown) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value))))].map(v => v.toString(16).padStart(2, '0')).join(''); }
export function FeatureWorkspace({ snapshot, initialId = '', sourceGoalId = '', sourceTicket = '', onOpen = () => {} }: { snapshot: OfficeSnapshot; initialId?: string; sourceGoalId?: string; sourceTicket?: string; onOpen?: (project: string, id: string) => void }) {
    const panelId = useId(), requestVersion = useRef(0);
    const project = snapshot.project!.id;
    const [features, setFeatures] = useState<Feature[]>(snapshot.features || []), [selected, setSelected] = useState(initialId), [creating, setCreating] = useState(!!sourceGoalId || !!sourceTicket);
    const goal = (snapshot.goals || []).find(g => g.id === sourceGoalId), ticket = snapshot.tickets.find(t => t.key === sourceTicket);
    const [title, setTitle] = useState(goal?.title || ticket?.summary || ''), [intent, setIntent] = useState(goal?.detail || ''), [revision, setRevision] = useState('');
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [mobile, setMobile] = useState('Conversation');
    useEffect(() => { setFeatures(snapshot.features || []); }, [snapshot.features]);
    useEffect(() => {
        const controller = new AbortController(), version = requestVersion.current;
        fetch(officeUrl('/api/features', project), { signal: controller.signal }).then(async r => { const body = await r.json(); if (!r.ok) throw new Error(body.error); if (version === requestVersion.current) setFeatures(body.features); }).catch(e => { if (!controller.signal.aborted) setError(String(e)); });
        return () => controller.abort();
    }, [project]);
    const feature = features.find(f => f.id === selected);
    async function send(action: string, values: Record<string, unknown> = {}) {
        requestVersion.current++; setBusy(true); setError('');
        try {
            const payload = { action, requestId: crypto.randomUUID(), ...(feature && action !== 'create' ? { expectedRevision: feature.revision } : {}), ...values };
            const response = await fetch(officeUrl('/api/features' + (action === 'create' ? '' : '/' + feature!.id), project), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Feature operation failed');
            setFeatures(current => [...current.filter(f => f.id !== body.id), body]); setSelected(body.id); setCreating(false); return true;
        } catch (e) { setError(String(e)); return false; } finally { setBusy(false); }
    }
    const round = feature?.rounds.at(-1), pending = round && !Object.keys(round.answers).length && round.questions.length > 0;
    return <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-6 text-13 leading-relaxed max-tablet:grid-cols-[160px_minmax(0,1fr)] max-compact:block">
        <nav aria-label="Features" className="flex flex-col gap-2 max-compact:mb-5 max-compact:flex-row max-compact:overflow-x-auto"><Button disabled={busy || snapshot.mode === 'demo'} onClick={() => { setCreating(true); setSelected(''); }}>New feature</Button>
            {features.map(f => <button className={interactive + " rounded-8 border border-drawer-line p-3 text-left aria-current:bg-roster-hover max-compact:min-w-36"} key={f.id} type="button" aria-current={selected === f.id ? 'page' : undefined} onClick={() => { setSelected(f.id); setCreating(false); }}><strong className="block">{f.title}</strong><span className="block">{f.paused ? 'Paused' : f.phase} · {f.status}</span>{f.rounds.at(-1)?.questions.some(q => !f.rounds.at(-1)!.answers[q.id]) && <small>Questions waiting</small>}</button>)}
        </nav>
        {creating ? <form className="min-w-0" onSubmit={e => { e.preventDefault(); void send('create', { title, intent, sourceGoalId, sourceTicket }); }}><PanelHeader icon={<FileText size={26}/>}>Plan a feature with Casey</PanelHeader><p>Start with the problem you want solved. Casey will research the project and bring you the decisions.</p><label className="my-3 grid gap-2">Feature name<input className={field + " " + fieldFocus + " rounded-6 p-3"} required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label><label className="my-3 grid gap-2">What should this accomplish?<textarea className={field + " " + fieldFocus + " rounded-6 p-3"} required maxLength={20000} rows={7} value={intent} onChange={e => setIntent(e.target.value)} /></label><Button variant="primary" type="submit" disabled={busy}>Start discovery</Button></form> : feature ? <main className="min-w-0">
            <header><PanelHeader icon={<FileText size={26}/>}>{feature.title}</PanelHeader><ol className="flex list-none flex-wrap gap-3 p-0 capitalize" aria-label="Feature progress">{phases.map(phase => <li className="aria-current:border-b-2 aria-current:font-bold" key={phase} aria-current={feature.phase === phase ? 'step' : undefined}>{phase}</li>)}</ol><p role="status">{feature.detail}</p>
                <div className="my-3 flex flex-wrap gap-2">{feature.status === 'waiting' && feature.phase === 'discovery' && !pending && feature.briefs.length > 0 && <Button variant="primary" disabled={busy || feature.paused} onClick={() => void send('create-plan', { briefDigest: feature.briefs.at(-1)!.digest })}>Confirm brief & create plan</Button>}
                {feature.phase === 'approval' && <Button variant="primary" disabled={busy || feature.paused} onClick={async () => { if (feature.manifest) await send('approve', { planDigest: feature.plans.at(-1)!.digest, manifestDigest: await hash(feature.manifest) }); }}>Approve & start delivery</Button>}
                <Button disabled={busy} onClick={() => void send(feature.paused ? 'resume' : 'pause')}>{feature.paused ? 'Resume feature' : 'Pause feature'}</Button>{feature.status === 'blocked' && <Button disabled={busy} onClick={() => void send('reconcile')}>Reconcile saved progress</Button>}</div>
            </header>
            <LinkedFeatures feature={feature} projects={snapshot.projects} send={send} onOpen={onOpen} />
            <div className="mt-4 hidden gap-2 max-tablet:flex" role="tablist" aria-label="Feature workspace panels">{['Conversation', 'Document'].map((name, index) => <button className={interactive + " rounded-6 border border-drawer-line px-3 py-2 aria-selected:bg-roster-hover"} type="button" role="tab" key={name} id={panelId + name} aria-controls={panelId + name + 'panel'} tabIndex={mobile === name ? 0 : -1} aria-selected={mobile === name} onClick={() => setMobile(name)} onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index;
                document.getElementById(panelId + ['Conversation', 'Document'][next])?.focus();
            }}>{name}</button>)}</div>
            <div className="mt-6 grid grid-cols-[minmax(260px,.9fr)_minmax(280px,1.1fr)] gap-6 max-tablet:block"><section id={panelId + "Conversationpanel"} role="tabpanel" aria-labelledby={panelId + "Conversation"} aria-label="Feature conversation" className={mobile === "Conversation" ? "min-w-0" : "min-w-0 max-tablet:hidden"}>
                {feature.conversation.map(message => <article className="border-b border-drawer-line py-3" key={message.id}><strong>{message.role === 'human' ? 'You' : message.role === 'analyst' ? 'Casey' : message.role === 'developer' ? 'Alex' : 'Independent review'}</strong><p className="whitespace-pre-wrap break-words">{message.text}</p></article>)}
                {pending && round && <QuestionRound key={project + feature.id + round.id} project={project} feature={feature.id} round={round} busy={busy || feature.paused} submit={answers => send('answer', { roundId: round.id, answers })} />}
                <form onSubmit={async e => { e.preventDefault(); if (await send('revise', { instruction: revision })) setRevision(''); }}><label className="my-3 grid gap-2">Correct or add a decision<textarea className={field + " " + fieldFocus + " rounded-6 p-3"} required value={revision} maxLength={20000} rows={3} onChange={e => setRevision(e.target.value)} /></label><Button type="submit" disabled={busy || !revision.trim()}>Save decision & revise</Button></form>
            </section><div id={panelId + "Documentpanel"} role="tabpanel" aria-labelledby={panelId + "Document"} className={mobile === "Document" ? "min-w-0" : "min-w-0 max-tablet:hidden"}><FeatureDocuments key={feature.id} feature={feature} snapshot={snapshot} /></div></div>
        </main> : <p className="p-4 text-muted">Choose a feature or start discovery with Casey.</p>}
        {error && <p role="alert" className="col-span-full text-tag-blocked-ink">{error}</p>}
    </div>;
}
