import {useState} from 'react';
import type {OfficeSnapshot} from '../../shared';
import {officeUrl} from '../../shared';
import {Button} from '../../ui';
export function TicketPlanningAction({snapshot,ticket,open}:{snapshot:OfficeSnapshot;ticket:string;open:(id?:string)=>void}) {
    const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
    const active=snapshot.featurePlanning?.assessment;
    const feature=snapshot.features?.find(f=>f.phase!=='complete'&&(f.sourceTicket===ticket||f.publication.some(p=>p.key===ticket)));
    if(!active)return <Button full className="mb-3" disabled={snapshot.mode==='demo'} onClick={()=>open()}>Plan a feature from this ticket</Button>;
    return <><Button full className="mb-3" disabled={busy||snapshot.mode==='demo'} onClick={async()=>{
        if(feature){open(feature.id);return;}setBusy(true);setMessage('');
        try{const response=await fetch(officeUrl('/api/features/assess',snapshot.project!.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:ticket,requestId:crypto.randomUUID()})});const body=await response.json();if(!response.ok)throw new Error(body.error);if(body.featureId)open(body.featureId);else setMessage(body.outcome?'The existing ticket delivery decision is retained.':'Morgan’s assessment is queued.');}catch(error){setMessage(String(error));}finally{setBusy(false);}
    }}>{feature?'Open feature plan':'Ask Morgan to assess'}</Button>{message&&<p role="status" className="mb-3 text-13">{message}</p>}</>;
}
