import type { Extractor } from './artifacts/extraction';
import type { SecretScanner } from './sources/admission';
import { uploadArtifact } from './artifacts/upload';
import { CommittedBrain } from './brain/reader';
import { retrieve } from './retrieval';
import { committedKnowledgeMap } from './map/committed-map';
import { committedNotePage } from './brain/note-page';
import { knowledgeActivityPage } from './activity/page';
import type { BrainReader } from './brain/reader';
import type { Store } from '../store/store';
import type { SourceRegistry } from './sources/registry';
import { sourceList } from './sources/projection';
import { json } from '../office/http/responses';
import { assignmentLookups } from './lookup/assignments';
import { publicSearch } from './lookup/public-reference';
import { assignmentKnowledge } from './assignment-view';
import { digestKnowledge } from './digests/private-body';
import { evidenceVersions } from './sources/evidence-versions';
import { evidencePage } from './sources/evidence-page';
import { capturePage } from './activity/captures';

export async function knowledgeRoute(req: Request, url: URL, registry: SourceRegistry, stores: Map<string, Store>, project: string, brain: BrainReader = new CommittedBrain(), upload?: {extract:Extractor;scan:SecretScanner}): Promise<Response | undefined> {
    if (!url.pathname.startsWith('/api/knowledge/')) return;
    if (url.pathname === '/api/knowledge/lookup') return assignmentLookups.route(req,url);
    if (!stores.has(project)) return json({ error: 'Unknown project' }, 404);
    const context = { registry, stores, brain };
    const privateJson = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
    const artifactRoute=/^\/api\/knowledge\/sources\/([a-f0-9-]{36})\/artifacts$/.exec(url.pathname);
    if (artifactRoute && req.method === 'POST') { try { return privateJson(await uploadArtifact(context,project,artifactRoute[1],req,upload?.extract,upload?.scan)); } catch { return privateJson({error:'Artifact source unavailable in this scope'},404); } }
    if (req.method !== 'GET') return privateJson({ error: 'Use the Office command route for source changes' },405);
    if(url.pathname==='/api/knowledge/captures'){try{return privateJson(await capturePage(context,project,url.searchParams.get('after')||'',url.searchParams.get('selected')||''));}catch{return privateJson({error:'Invalid or unavailable capture page'},400);}}
    if(url.pathname==='/api/knowledge/digest-settings')return privateJson(stores.get(project)!.state.knowledge?.digestDelivery||{enabled:false,enabledAt:'',version:'',workspace:'',workspaceId:'',channelId:'',channelName:''});
    if(url.pathname==='/api/knowledge/note'){const raw=url.searchParams.get('offset')||'0';if(!/^\d{1,7}$/.test(raw))return privateJson({error:'Invalid note section'},400);const note=await committedNotePage(brain,url.searchParams.get('snapshot')||'',url.searchParams.get('path')||'',url.searchParams.get('sha256')||'',Number(raw));return note?privateJson(note):privateJson({error:'Committed note unavailable at this revision'},404);}
    if(url.pathname==='/api/knowledge/versions'){const source=url.searchParams.get('source')||'',unit=url.searchParams.get('unit')||'',after=url.searchParams.get('after')||'';if(source.length>36||unit.length>2000||after.length>100)return privateJson({error:'Invalid evidence version page'},400);const page=evidenceVersions(context,project,source,unit,after);return page?privateJson(page):privateJson({error:'Evidence versions unavailable in this scope'},404);}
    if(url.pathname==='/api/knowledge/digest'){const record=digestKnowledge(context,project,url.searchParams.get('id')||'');return record?privateJson(record):privateJson({error:'Knowledge digest unavailable in this scope'},404);}
    if (url.pathname === '/api/knowledge/assignment') {const index=url.searchParams.get('lookup');if(index!==null&&!/^(?:[1-9]|1[0-9]|20)$/.test(index))return privateJson({error:'Invalid lookup page'},400);const detail=assignmentKnowledge(context,project,url.searchParams.get('id')||'',index===null?undefined:Number(index));return detail?privateJson(detail):privateJson({error:'Assignment knowledge unavailable in this scope'},404);}
    if (url.pathname === '/api/knowledge/search') {
        const query = url.searchParams.get('q') || ''; if (query.length > 2000) return privateJson({ error: 'Query exceeds 2000 characters' }, 400);
        return privateJson(publicSearch(await retrieve(context, project, query)));
    }
    if (url.pathname === '/api/knowledge/evidence') {const offset=url.searchParams.get('offset')||'0';if(!/^\d{1,7}$/.test(offset))return privateJson({error:'Invalid evidence section'},400);const record=evidencePage(context,project,url.searchParams.get('id')||'',Number(offset));return record?privateJson(record):privateJson({error:'Evidence unavailable in this scope or section'},404);}
    if (url.pathname === '/api/knowledge/map') {const scope=url.searchParams.get('scope')||'project';if(!['project','global'].includes(scope))return privateJson({error:'Invalid map scope'},400);return privateJson(await committedKnowledgeMap(context, project,scope==='global'));}
    if (url.pathname === '/api/knowledge/activity') return privateJson(await knowledgeActivityPage(context, project));
    if (url.pathname === '/api/knowledge/sources') {
        const after = url.searchParams.get('after') || '';
        if (after && !/^[a-f0-9-]{36}$/.test(after)) return json({ error: 'Invalid source page' }, 400);
        const connections = new Map<string, { id: string; workspace: string; appId: string; tools: Record<string, string>; publicHosts: string[] }>();
        // Operator connection choices expose no credentials, channel names or source content.
        for (const s of registry.all()) if (s.authority) {
            const { workspace, appId, tools, publicHosts } = s.authority;
            connections.set(JSON.stringify([workspace, appId]), { id: s.id, workspace, appId, tools, publicHosts });
        }
        return new Response(JSON.stringify({ ...sourceList(registry, stores, project, after), connections: [...connections.values()],
            cutover: registry.meta<{ state: string }>('cutover')?.state || 'not-ready' }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
    }
    return json({ error: 'Unknown knowledge route' }, 404);
}
