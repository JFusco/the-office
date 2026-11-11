import { useEffect, useState,useCallback } from 'react';
/** Scope is part of the retained value: an old response is never shown for a new project or route. */
export function useKnowledgeView<T>(project: string, route: string) {
    const scope=JSON.stringify([project,route]);
    const [result,setResult]=useState<{scope:string;data:T|null;error:string;loading:boolean}>({scope,data:null,error:'',loading:true});
    const [revision,setRevision]=useState(0),refresh=useCallback(()=>setRevision(n=>n+1),[]);
    useEffect(() => { const controller = new AbortController();
        setResult(prior=>({scope,data:prior.scope===scope?prior.data:null,error:'',loading:true}));
        void fetch(`/api/knowledge/${route}${route.includes('?') ? '&' : '?'}project=${encodeURIComponent(project)}`, { signal: controller.signal, cache: 'no-store' })
            .then(async r => { const value = await r.json(); if (!r.ok) throw Error(value.error || 'Knowledge unavailable'); if (!controller.signal.aborted) setResult({scope,data:value,error:'',loading:false}); })
            .catch(e => { if (!controller.signal.aborted) setResult(prior=>({...prior,error:e.message,loading:false})); });
        return () => controller.abort();
    }, [project,route,revision,scope]);
    const current=result.scope===scope?result:{data:null,error:'',loading:true};
    return { data:current.data,error:current.error,loading:current.loading,refreshing:current.loading&&!!current.data,refresh };
}
