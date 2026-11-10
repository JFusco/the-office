import { UploadSource } from './UploadSource';
import { PanelHeader } from '../../ui/PanelHeader';
import { FileText, Plus } from '../../ui/icons';
import { Button, CheckField, Select, Notice, Tag, cx, field, fieldLabel, selectField, checkbox, summary, mutedCopy } from '../../ui';
import { useEffect, useState } from 'react';
import type { KnowledgeSourceSummary } from '../../contracts/knowledge-sources';
import { SourceCard } from './SourceCard';
import { AddSourceForm, type SourceConnection } from './AddSourceForm';
import { AddPublicSource } from './AddPublicSource';
export function Sources({ project, projects }: { project: string; projects: { id: string; name: string }[] }) {
    const [uploadTarget,setUploadTarget]=useState<string>();
    const [addingPublic,setAddingPublic]=useState(false);
    const [sources, setSources] = useState<KnowledgeSourceSummary[]>([]), [connections, setConnections] = useState<SourceConnection[]>([]);
    const [error, setError] = useState(''), [loading, setLoading] = useState(true), [adding, setAdding] = useState(false), [uploading,setUploading] = useState(false), [history, setHistory] = useState(false);
    const [pending, setPending] = useState(false), [notice, setNotice] = useState(''), [next, setNext] = useState<string | null>(null), [cutover, setCutover] = useState('');
    async function reload(after = '') {
        const response = await fetch(`/api/knowledge/sources?project=${encodeURIComponent(project)}${after ? `&after=${encodeURIComponent(after)}` : ''}`, { cache: 'no-store' });
        const data = await response.json(); if (!response.ok) throw Error(data.error || 'Sources unavailable');
        setSources(old => after ? [...old, ...data.sources] : data.sources); setConnections(data.connections); setNext(data.next); setCutover(data.cutover);
    }
    useEffect(() => { let current = true; setLoading(true); setError(''); setSources([]);
        // Abort old-project requests so delayed responses cannot replace the selected project's list.
        const abort = new AbortController();
        void fetch(`/api/knowledge/sources?project=${encodeURIComponent(project)}`, { signal: abort.signal, cache: 'no-store' }).then(async r => {
            const data = await r.json(); if (!r.ok) throw Error(data.error || 'Sources unavailable');
            if (current) { setSources(data.sources); setConnections(data.connections); setNext(data.next); setCutover(data.cutover); }
        }).catch(e => { if (current) setError(String(e.message)); }).finally(() => { if (current) setLoading(false); });
        return () => { current = false; abort.abort(); };
    }, [project]);
    async function mutate(source: unknown) {
        setPending(true); setError(''); setNotice('');
        try {
            const response = await fetch(`/api/commands?project=${encodeURIComponent(project)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'knowledge-source', source }) });
            const data = await response.json(); if (!response.ok) throw Error(data.error || 'Source change was not saved');
            await reload(); setAdding(false);setAddingPublic(false); setNotice('Source settings saved. Harper uses this shared registry.');
        } catch (e) { setError(e instanceof Error ? e.message : 'Source change unavailable'); }
        finally { setPending(false); }
    }
    const visible = sources.filter(s => history || s.state !== 'removed' && s.state !== 'withdrawn');
    return <section aria-labelledby="sources-heading">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-5"><div><PanelHeader id="sources-heading" icon={<FileText size={26}/>}>Sources</PanelHeader><p className={mutedCopy}>Harper collects and curates evidence from your configured sources. Share a stream with projects that need it.</p></div><div className="flex flex-wrap gap-3"><Button disabled={pending} onClick={()=>void reload().catch(e=>setError(String(e.message)))}>Refresh sources</Button><Button onClick={()=>{setUploadTarget(undefined);setUploading(true);}}>Upload a document</Button><Button onClick={()=>setAddingPublic(true)}>Add a public link</Button><Button variant="primary" onClick={() => setAdding(true)}><Plus size={15}/> Add a source</Button></div></div>
        <div className="rounded-7 border border-section-rule bg-notes p-4 my-5 text-11 leading-body text-notes-ink"><strong className="block mb-1">Collection belongs to each source’s home project.</strong> Harper follows that project’s pause and learning settings. All projects share one daily collection counter. The standard allowance is eight launches; approved historical seeding can temporarily raise it to 32. Sharing a source adds no collection capacity.</div>
        {cutover && cutover !== 'ready' && <p role="status" className="my-3 rounded-7 border border-notice-line bg-notice p-4 text-11 leading-body text-notice-ink">Registry migration is not ready. Collection is paused until retained intake is reconciled.</p>}
        {error && <p role="alert" className="my-3 rounded-7 border border-notice-line bg-notice p-4 text-11 leading-body text-notice-ink">{error}</p>}{notice && <p role="status">{notice}</p>}
        {uploading && <UploadSource key={uploadTarget||'new'} sourceId={uploadTarget} project={project} onSaved={()=>void reload().catch(e=>setError(String(e.message)))} onClose={()=>setUploading(false)}/>}
        {adding && <AddSourceForm connections={connections} project={project} pending={pending} onSubmit={mutate} onClose={() => setAdding(false)}/>}
        {addingPublic&&<AddPublicSource project={project} pending={pending} onSubmit={mutate} onClose={()=>setAddingPublic(false)}/>}
        <div className="flex flex-wrap justify-between items-center gap-3 my-5 text-11 text-muted"><span>{visible.length} sources in this view</span><CheckField className="w-fit text-11" checked={history} onChange={e => setHistory(e.target.checked)}>Show removed and withdrawn</CheckField></div>
        {loading ? <p role="status">Loading Harper’s sources…</p> : !visible.length ? <div className="rounded-7 border border-drawer-line bg-paper p-8 text-center text-12 leading-body text-muted"><h3 className="text-15 font-heading">No sources yet</h3><p>Add a Slack channel to give Harper project evidence. You can add several channels and explicitly share a stream with other projects.</p></div> : <div className="grid gap-4">{visible.map(source => <SourceCard key={source.id} source={source} project={project} projects={projects} pending={pending} onUpload={()=>{setUploadTarget(source.id);setUploading(true);}} onCommand={mutate}/>)}</div>}
        {next && <Button onClick={() => void reload(next).catch(e => setError(String(e.message)))}>Load more sources</Button>}
        <p className="mt-6 max-w-3xl text-11 leading-body text-muted">The restricted acquisition worker sees native Slack content first. Secret scanning happens after acquisition and before evidence enters the library, curation, employee briefings or digests.</p>
    </section>;
}
