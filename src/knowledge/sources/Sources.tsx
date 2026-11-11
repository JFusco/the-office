import { LoadingState } from '../../ui/LoadingState';
import { KnowledgeReveal } from '../KnowledgeReveal';
import { UploadSource } from './UploadSource';
import { PanelHeader } from '../../ui/PanelHeader';
import { FileText, Plus } from '../../ui/icons';
import { Button, CheckField, Select, Notice, Tag, cx, field, fieldLabel, selectField, checkbox, summary, mutedCopy } from '../../ui';
import { useEffect, useState, useRef } from 'react';
import type { KnowledgeSourceSummary } from '../../contracts/knowledge-sources';
import { SourceCard } from './SourceCard';
import { AddPublicSource } from './AddPublicSource';
export function Sources({ project, projects }: { project: string; projects: { id: string; name: string }[] }) {
    const [uploadTarget,setUploadTarget]=useState<string>();
    const [addingPublic,setAddingPublic]=useState(false);
    const [sources, setSources] = useState<KnowledgeSourceSummary[]>([]);
    const [error, setError] = useState(''), [loading, setLoading] = useState(true), [uploading,setUploading] = useState(false), [history, setHistory] = useState(false);
    const reading=useRef<Promise<void>|null>(null), [refreshing,setRefreshing] = useState<''|'refresh'|'more'>('');
    const [pending, setPending] = useState(false), [notice, setNotice] = useState(''), [next, setNext] = useState<string | null>(null);
    async function reload(after = ''): Promise<void> {
        if(reading.current) {
            if(after)return reading.current;
            await reading.current.catch(()=>{});
            return reload();
        }
        const operation=(async()=>{
            setRefreshing(after?'more':'refresh');
            try {
                const response=await fetch(`/api/knowledge/sources?project=${encodeURIComponent(project)}${after?`&after=${encodeURIComponent(after)}`:''}`,{cache:'no-store'});
                const data=await response.json();if(!response.ok)throw Error(data.error||'Sources unavailable');
                setSources(old=>after?[...old,...data.sources]:data.sources);setNext(data.next);
            }finally{setRefreshing('');}
        })();
        reading.current=operation;
        try{await operation;}finally{if(reading.current===operation)reading.current=null;}
    }
    useEffect(() => { let current = true; setLoading(true); setError(''); setSources([]);
        // Abort old-project requests so delayed responses cannot replace the selected project's list.
        const abort = new AbortController();
        void fetch(`/api/knowledge/sources?project=${encodeURIComponent(project)}`, { signal: abort.signal, cache: 'no-store' }).then(async r => {
            const data = await r.json(); if (!r.ok) throw Error(data.error || 'Sources unavailable');
            if (current) { setSources(data.sources); setNext(data.next); }
        }).catch(e => { if (current) setError(String(e.message)); }).finally(() => { if (current) setLoading(false); });
        return () => { current = false; abort.abort(); };
    }, [project]);
    async function mutate(source: unknown) {
        setPending(true); setError(''); setNotice('');
        try {
            const response = await fetch(`/api/commands?project=${encodeURIComponent(project)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'knowledge-source', source }) });
            const data = await response.json(); if (!response.ok) throw Error(data.error || 'Source change was not saved');
            await reload(); setAddingPublic(false); setNotice('Source settings saved. Harper uses this shared registry.');
        } catch (e) { setError(e instanceof Error ? e.message : 'Source change unavailable'); }
        finally { setPending(false); }
    }
    const visible = sources.filter(s => history || s.state !== 'removed' && s.state !== 'withdrawn');
    return <section aria-labelledby="sources-heading">
        <div className="flex flex-wrap items-start justify-between gap-6 mb-5"><div><PanelHeader id="sources-heading" icon={<FileText size={26}/>}>Sources</PanelHeader><p className="max-w-reading-copy text-14 leading-relaxed text-muted">Harper collects and curates evidence from your configured sources. Share a stream with projects that need it.</p></div><div className="flex flex-wrap gap-3"><Button disabled={pending||loading||!!refreshing} onClick={()=>void reload().catch(e=>setError(String(e.message)))}>Refresh sources</Button><Button onClick={()=>{setUploadTarget(undefined);setUploading(true);}}>Upload a document</Button><Button variant="primary" onClick={()=>setAddingPublic(true)}><Plus size={15}/> Add a public link</Button></div></div>
        <details className="my-5 rounded-7 border border-section-rule bg-notes p-4 text-12 leading-body text-notes-ink"><summary>How source collection works</summary><p className="mt-3 max-w-reading-copy">Collection follows each source’s home project settings. Active subscriptions show which projects receive its knowledge. Sharing a source does not add collection capacity. All projects share the daily collection counter of eight reader launches.</p></details>
        {pending && <LoadingState>Saving source settings…</LoadingState>}{refreshing && !pending && <LoadingState>{refreshing==='more'?'Loading more sources…':'Refreshing sources…'}</LoadingState>}{error && <p role="alert" className="my-3 rounded-7 border border-notice-line bg-notice p-4 text-11 leading-body text-notice-ink">{error}</p>}{notice && <p role="status">{notice}</p>}
        {uploading && <UploadSource key={uploadTarget||'new'} sourceId={uploadTarget} project={project} onSaved={()=>void reload().catch(e=>setError(String(e.message)))} onClose={()=>setUploading(false)}/>}
        {addingPublic&&<AddPublicSource project={project} pending={pending} onSubmit={mutate} onClose={()=>setAddingPublic(false)}/>}
        <div className="flex flex-wrap justify-between items-center gap-3 my-5 text-11 text-muted"><span>{visible.length} sources in this view</span><CheckField size="sm" className="w-fit" checked={history} onChange={e => setHistory(e.target.checked)}>Show removed and withdrawn</CheckField></div>
        <KnowledgeReveal ready={!loading} label="Loading Harper’s sources…">{error&&!visible.length?<p>Sources could not be loaded.</p>:!visible.length ? <div className="rounded-7 border border-drawer-line bg-paper p-6 text-left text-14 leading-body text-muted"><h3 className="text-18 font-heading">No sources yet</h3><p>Add a public link or upload a document to give Harper project evidence. You can share a source with other projects.</p></div> : <div className="grid gap-4">{visible.map(source => <SourceCard key={source.id} source={source} project={project} projects={projects} pending={pending} onUpload={()=>{setUploadTarget(source.id);setUploading(true);}} onCommand={mutate}/>)}</div>}
        {next && <Button disabled={pending||loading||!!refreshing} onClick={() => void reload(next).catch(e => setError(String(e.message)))}>Load more sources</Button>}
        </KnowledgeReveal><p className="mt-6 max-w-3xl text-11 leading-body text-muted">Secret scanning happens before evidence enters the library, curation, employee briefings or digests.</p>
    </section>;
}
