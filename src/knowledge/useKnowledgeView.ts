import { useEffect, useState,useCallback } from 'react';
/** Abort project/view changes and clear old private responses before the next read. */
export function useKnowledgeView<T>(project: string, route: string) {
    const [data,setData] = useState<T | null>(null), [error,setError] = useState('');
    const [revision,setRevision]=useState(0),refresh=useCallback(()=>setRevision(n=>n+1),[]);
    useEffect(() => { const controller = new AbortController(); setData(null); setError('');
        void fetch(`/api/knowledge/${route}${route.includes('?') ? '&' : '?'}project=${encodeURIComponent(project)}`, { signal: controller.signal, cache: 'no-store' })
            .then(async r => { const value = await r.json(); if (!r.ok) throw Error(value.error || 'Knowledge unavailable'); if (!controller.signal.aborted) setData(value); })
            .catch(e => { if (!controller.signal.aborted) setError(e.message); });
        return () => controller.abort();
    }, [project,route,revision]);
    return { data,error,refresh };
}
