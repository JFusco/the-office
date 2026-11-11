import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {FeatureQuestionProjection} from '../../contracts/features';
import {officeUrl} from '../../shared';
import {Button} from '../../ui';
import {Dialog} from '../../ui/Dialog';
import {QuestionStepper} from './QuestionStepper';
import {nextQuestion,orderedQuestions,questionKey} from './question-queue';
const suppressedKey='office.feature.questions.later';
function readSuppressed(){try{return new Set<string>(JSON.parse(localStorage.getItem(suppressedKey)||'[]'));}catch{return new Set<string>();}}
/** The persistent control lives in the dock slot, outside every drawer; it exists only with activation or pending rounds. */
export function QuestionDialogHost({rounds=[],active,slot,suspended,refresh}:{rounds?:FeatureQuestionProjection[];active:boolean;slot:HTMLElement|null;suspended:boolean;refresh:()=>void}) {
    const control=useRef<HTMLButtonElement>(null),[suppressed,setSuppressed]=useState(readSuppressed),[current,setCurrent]=useState<FeatureQuestionProjection>(),[list,setList]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
    const live=current&&rounds.find(r=>questionKey(r)===questionKey(current)&&r.revision===current.revision);
    const allowed=useRef(false);allowed.current=!suspended&&!!live;
    useEffect(()=>{if(suspended){setCurrent(undefined);return;}setCurrent(previous=>nextQuestion(rounds,suppressed,previous));},[rounds,suspended,suppressed]);
    function suppress(round:FeatureQuestionProjection){setSuppressed(old=>{const value=new Set(old);value.add(questionKey(round));try{localStorage.setItem(suppressedKey,JSON.stringify([...value].slice(-200)));}catch{/* In-memory Later still works. */}return value;});setCurrent(undefined);setError('');}
    async function send(action:string,values:Record<string,unknown>){
        if(!live||!allowed.current||busy)return false;
        const target=live;setBusy(true);setError('');
        try{
            const url=officeUrl('/api/features/'+encodeURIComponent(target.featureId),target.projectId)+'&officeWide=1';
            const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,requestId:crypto.randomUUID(),expectedRevision:target.revision,roundId:target.roundId,...values})});
            const body=await response.json();
            if(!response.ok){if(['stale-round','revision-change','changed-precondition','source-unavailable'].includes(body.code)){setCurrent(undefined);refresh();}throw new Error(body.error||'Unable to save this response');}
            if(action==='answer'||values.operation==='apply')suppress(target);
            refresh();return true;
        }catch(e){setError(String(e));return false;}finally{setBusy(false);}
    }
    const visible=active||rounds.length>0;
    return <>
        {visible&&slot&&createPortal(<Button ref={control} className="whitespace-nowrap" disabled={suspended} onClick={()=>setList(v=>!v)} aria-expanded={list}>Questions for you ({rounds.length})</Button>,slot)}
        {visible&&(list&&!suspended||!live&&!!error)&&<div className="fixed bottom-[calc(var(--spacing-dock)+12px)] right-5 z-[70] max-compact:bottom-[calc(var(--spacing-dock-compact)+12px)] max-compact:right-3">
            {!live&&error&&<p role="alert" className="mb-2 max-w-sm rounded-8 bg-paper p-3 text-13">{error}</p>}
            {list&&!suspended&&<nav aria-label="Questions for you" className="max-h-[50dvh] max-w-sm overflow-auto rounded-8 border border-drawer-line bg-paper p-3 shadow-lg">{orderedQuestions(rounds).map(round=><button type="button" className="block w-full rounded-6 p-3 text-left hover:bg-roster-hover" key={questionKey(round)} onClick={()=>{setCurrent(round);setList(false);setError('');}}><strong>{round.projectName}{round.ticket?' / '+round.ticket:''}</strong><span className="block">{round.title}</span></button>)}{!rounds.length&&<p>No questions waiting.</p>}</nav>}
        </div>}
        <Dialog open={!suspended&&!!live} title={live?live.projectName+(live.ticket?' / '+live.ticket:''):'Questions for you'} description={live?live.title+' · '+(live.asker==='product'?'Casey':live.asker==='review'?'Independent review':'Office recovery'):''} onLater={()=>{if(live&&!busy)suppress(live);}} returnFocus={control}>
            {live&&<QuestionStepper key={questionKey(live)} project={live.projectId} feature={live.featureId} round={live} busy={busy||suspended} submit={answers=>send('answer',{answers,...(live.reviewRun?{reviewRun:live.reviewRun,reviewRevision:live.reviewRevision}:{})})} act={input=>send('harness-action',input)} onLater={()=>suppress(live)}/>}
            {live&&error&&<p role="alert" className="mt-3 text-tag-blocked-ink">{error}</p>}
        </Dialog>
    </>;
}
