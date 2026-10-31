import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, PORT } from '../config';
import { containedFile } from '../../cec/workflow';
import type { ServiceContext, RequestContext } from './context';
import { json, fileResponse } from './responses';

/** Unknown API paths 404; everything else is the built UI (or the Vite dev server). */
export async function staticRoute(req: Request, url: URL, context: ServiceContext & RequestContext): Promise<Response | undefined> {
    const { offices, serviceHealth, itSpecialist, loadedRevision, snapshot, vite, project, store, engine, conversations, coordinator } = context;
    if (url.pathname.startsWith('/api/'))
        return json({ error: 'Not found' }, 404);
    if (vite) {
        return fetch(`http://127.0.0.1:${PORT + 1}${url.pathname}${url.search}`, { method: req.method, headers: { Accept: req.headers.get('accept') || '*/*' } });
    }
    const file = resolve(ROOT, 'dist', '.' + decodeURIComponent(url.pathname));
    if (containedFile(file, resolve(ROOT, 'dist')) && existsSync(file))
        return fileResponse(file);
    if (url.pathname.includes('.') && url.pathname !== '/')
        return json({ error: 'Not found' }, 404);
    return fileResponse(resolve(ROOT, 'dist/index.html'));
    return undefined;
}
