import { DrawerTopic } from '../office/drawer/DrawerTopic';
import { pendingRounds } from './questions/pending-round';
import { LoadingState } from '../ui/LoadingState';
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
    const container=useRef<HTMLDivElement>(null), [wide,setWide]=useState(false);
    useEffect(()=>{const el=container.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setWide(entry.contentRect.width>=900));observer.observe(el);return ()=>observer.disconnect();},[]);
    const requestVersion = useRef(0);
    const project = snapshot.project!.id;
    const [features, setFeatures] = useState<Feature[]>(snapshot.features || []), [selected, setSelected] = useState(initialId), [creating, setCreating] = useState(!!sourceGoalId || !!sourceTicket);
    const goal = (snapshot.goals || []).find(g => g.id === sourceGoalId), ticket = snapshot.tickets.find(t => t.key === sourceTicket);
    const [title, setTitle] = useState(goal?.title || ticket?.summary || ''), [intent, setIntent] = useState(goal?.detail || ''), [revision, setRevision] = useState('');
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
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
    const round = feature && pendingRounds(feature)[0], pending = !!round;
    return <div ref={container} className={wide ? "grid grid-cols-[220px_minmax(0,1fr)] gap-section-gap text-13" : "space-y-section-gap text-13"}>
        {(!initialId || wide) && <nav aria-label="Features" className="flex flex-col gap-2 max-compact:mb-5 max-compact:flex-row max-compact:overflow-x-auto"><Button disabled={busy || snapshot.mode === 'demo'} onClick={() => { setCreating(true); setSelected(''); }}>New feature</Button>
            {features.map(f => <button className={interactive + " rounded-8 border border-drawer-line p-3 text-left aria-current:bg-roster-hover max-compact:min-w-36"} key={f.id} type="button" aria-current={selected === f.id ? 'page' : undefined} onClick={() => onOpen(project,f.id)}><strong className="block">{f.title}</strong><span className="block">{f.paused ? 'Paused' : f.phase} · {f.status}</span>{pendingRounds(f).length > 0 && <small>Questions waiting</small>}</button>)}
        </nav>}
        {creating ? <form className="min-w-0" onSubmit={e => { e.preventDefault(); void send('create', { title, intent, sourceGoalId, sourceTicket }); }}><PanelHeader icon={<FileText size={26}/>}>Plan a feature with Casey</PanelHeader><p>Start with the problem you want solved. Casey will research the project and bring you the decisions.</p><label className="my-3 grid gap-2">Feature name<input className={field + " " + fieldFocus + " rounded-6 p-3"} required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label><label className="my-3 grid gap-2">What should this accomplish?<textarea className={field + " " + fieldFocus + " rounded-6 p-3"} required maxLength={20000} rows={7} value={intent} onChange={e => setIntent(e.target.value)} /></label><Button variant="primary" type="submit" disabled={busy}>Start discovery</Button></form> : feature ? <main className="min-w-0">
            <header><PanelHeader icon={<FileText size={26}/>}>{feature.title}</PanelHeader><ol className="flex list-none flex-wrap gap-3 p-0 capitalize" aria-label="Feature progress">{phases.map(phase => <li className="aria-current:border-b-2 aria-current:font-bold" key={phase} aria-current={feature.phase === phase ? 'step' : undefined}>{phase}</li>)}</ol><p role="status">{feature.detail}</p>
                <div className="my-3 flex flex-wrap gap-2">{feature.status === 'waiting' && feature.phase === 'discovery' && !pending && feature.briefs.length > 0 && <Button variant="primary" disabled={busy || feature.paused} onClick={() => void send('create-plan', { briefDigest: feature.briefs.at(-1)!.digest })}>Confirm brief & create plan</Button>}
                {feature.phase === 'approval' && <Button variant="primary" disabled={busy || feature.paused} onClick={async () => { if (feature.manifest) await send('approve', { planDigest: feature.plans.at(-1)!.digest, manifestDigest: await hash(feature.manifest) }); }}>Approve & start delivery</Button>}
                <Button disabled={busy} onClick={() => void send(feature.paused ? 'resume' : 'pause')}>{feature.paused ? 'Resume feature' : 'Pause feature'}</Button>{feature.status === 'blocked' && <Button disabled={busy} onClick={() => void send('reconcile')}>Reconcile saved progress</Button>}</div>
            </header>
            <LinkedFeatures feature={feature} projects={snapshot.projects} send={send} onOpen={onOpen} />
            <FeatureReading wide={wide} conversation={<>
                {feature.conversation.map(message => <article className="border-b border-drawer-line py-3" key={message.id}><strong>{message.role === 'human' ? 'You' : message.role === 'analyst' ? 'Casey' : message.role === 'developer' ? 'Alex' : 'Independent review'}</strong><p className="whitespace-pre-wrap break-words">{message.text}</p></article>)}
                {pending && round && <QuestionRound key={project + feature.id + round.id} project={project} feature={feature.id} round={round} busy={busy || feature.paused} submit={answers => send('answer', { roundId: round.id, answers, ...(round.reviewRun ? {reviewRun:round.reviewRun,reviewRevision:round.reviewRevision} : {}) })} act={input => send('harness-action', { roundId: round.id, ...input })} />}
                <form onSubmit={async e => { e.preventDefault(); if (await send('revise', { instruction: revision })) setRevision(''); }}><label className="my-3 grid gap-2">Correct or add a decision<textarea className={field + " " + fieldFocus + " rounded-6 p-3"} required value={revision} maxLength={20000} rows={3} onChange={e => setRevision(e.target.value)} /></label><Button type="submit" disabled={busy || !revision.trim()}>Save decision & revise</Button></form>
            </>} document={<FeatureDocuments key={feature.id} feature={feature} snapshot={snapshot}/>} pending={pending}/>
        </main> : <p className="p-4 text-muted">Choose a feature or start discovery with Casey.</p>}
        {busy && <LoadingState className="col-span-full">Saving feature progress…</LoadingState>}{error && <p role="alert" className="col-span-full text-tag-blocked-ink">{error}</p>}
    </div>;
}

function FeatureReading({wide,conversation,document,pending}:{wide:boolean;conversation:React.ReactNode;document:React.ReactNode;pending:boolean}){
    if(wide) return <div className="mt-section-gap grid grid-cols-2 gap-section-gap"><section className="min-w-0" aria-label="Feature conversation">{conversation}</section><div className="min-w-0">{document}</div></div>;
    return <><DrawerTopic title="Conversation" detail={pending ? 'Question waiting' : undefined}>{conversation}</DrawerTopic><DrawerTopic title="Documents and delivery">{document}</DrawerTopic></>;
}
