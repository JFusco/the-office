import { requestAssessment } from './questions/assess-command';
import { FeatureError } from './progression/failure';
import { linkFeature } from './linked-features';
import type { Store } from '../store/store';
import type { FeatureWorkflow } from './workflow';
import { featureById } from './commands';
import { artifactPath } from './documents';
import { json, fileResponse } from '../office/http/responses';
export async function featureRoute(req: Request, url: URL, store: Store, workflow: FeatureWorkflow, stores: ReadonlyMap<string, Store> = new Map([[store.project.id, store]]), authorize: (id: string) => void = () => {}): Promise<Response | undefined> {
    if (!url.pathname.startsWith('/api/features')) return;
    const match = /^\/api\/features(?:\/([^/]+)(?:\/artifacts\/([^/]+))?)?$/.exec(url.pathname);
    if (!match) return json({ error: 'Unknown feature route' }, 404);
    try {
        const [, id, artifact] = match;
        if (req.method === 'GET') {
            if (artifact) return fileResponse(artifactPath(store, featureById(store, id), artifact), { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
            return json(id ? featureById(store, id) : { features: store.state.features || [] });
        }
        if (req.method !== 'POST' || artifact) return json({ error: 'POST required' }, 405);
        const text = await req.text();
        if (text.length > 100000) return json({ error: 'Feature request is too large' }, 413);
        const body = JSON.parse(text);
        if (id === 'assess') { if (typeof body.key !== 'string' || typeof body.requestId !== 'string' || !body.requestId.trim()) return json({error:'Ticket identity and request ID required'},400); return json(requestAssessment(store,body.key)); }
        if (id) authorize(id);
        if (id && body.action === 'link') return json(linkFeature(store, id, body, stores));
        return json(id ? await workflow.change(id, body, () => authorize(id)) : workflow.create(body));
    } catch (error) { return json({ error: String(error), ...(error instanceof FeatureError ? {code:error.code} : {}) }, 409); }
}
