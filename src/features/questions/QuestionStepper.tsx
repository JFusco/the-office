import {useEffect,useId,useRef,useState} from 'react';
import type {FeatureOption,FeatureQuestion,FeatureRoundAuthor} from '../../contracts/features';
import {Button,field,fieldFocus,interactive} from '../../ui';
import {draftKey,readDraft,saveDraft} from '../question-drafts';
import {normalizeQuestion} from './normalize-question';
export interface StepperRound {roundId:string;asker:FeatureRoundAuthor;questions:FeatureQuestion[];options?:FeatureOption[]}
export function QuestionStepper({project,feature,round,busy,submit,act,onLater}:{project:string;feature:string;round:StepperRound;busy:boolean;submit:(answers:Record<string,string>)=>Promise<boolean>;act?:(input:{operation:'apply';optionId:string}|{operation:'note';note:string})=>Promise<boolean>;onLater?:()=>void}) {
    const id=useId(),heading=useRef<HTMLHeadingElement>(null),questions=round.questions.map(q=>normalizeQuestion(q,q.id));
    const [step,setStep]=useState(0),[answers,setAnswers]=useState<Record<string,string>>(()=>Object.fromEntries(questions.map(q=>[q.id,readDraft(draftKey(project,feature,round.roundId,q.id))])));
    const [selected,setSelected]=useState(''),[note,setNote]=useState(()=>readDraft(draftKey(project,feature,round.roundId,'harness-note'))),[notice,setNotice]=useState('');
    const q=questions[step],harness=round.asker==='harness',shown=useRef(step);
    // Only Back/Next move focus; Dialog owns initial modal focus and inline rounds must not take it from the user.
    useEffect(()=>{if(shown.current===step)return;shown.current=step;heading.current?.focus();},[step]);
    const persist=(question:string,value:string)=>{try{saveDraft(draftKey(project,feature,round.roundId,question),value);setNotice('');}catch{setNotice('Your browser could not save this draft. Keep this page open until you submit.');}};
    const answer=(value:string)=>{setAnswers(current=>({...current,[q.id]:value}));persist(q.id,value);};
    async function send(){if(await submit(answers)){for(const question of questions){const key=draftKey(project,feature,round.roundId,question.id);try{if(readDraft(key)===answers[question.id])localStorage.removeItem(key);}catch{/* A retained draft is safe. */}}}}
    return <section aria-label="Question round">
        {!harness&&<p className="mb-2 text-12 text-muted">Question {step+1} of {questions.length}</p>}
        <h3 ref={heading} tabIndex={-1} data-question-focus className="mb-3 text-18 font-bold">{q?.question}</h3>
        {q?.recommendation&&<p className="mb-3"><strong>Recommendation:</strong> {q.recommendation}</p>}
        <fieldset disabled={busy} className="min-w-0">
            <legend className="sr-only">{harness?'Choose a recovery action':'Choose an answer or write your own'}</legend>
            <div className="grid gap-2">{(harness?round.options:q?.options)?.map(option=><label key={option.id} className={interactive+' flex cursor-pointer items-start gap-3 rounded-8 border border-drawer-line p-3'}>
                <input type="radio" className="mt-1" name={id+'-options'} value={option.id} checked={harness?selected===option.id:answers[q.id]===option.label} onChange={()=>harness?setSelected(option.id):answer(option.label)}/>
                <span className="min-w-0 break-words"><strong>{option.label}</strong>{!harness&&q.recommendedOptionId===option.id&&<span> (Recommended)</span>}{option.tradeoff&&<span className="mt-1 block text-13">{option.tradeoff}</span>}</span>
            </label>)}</div>
            {harness?<><label htmlFor={id+'-note'} className="mb-2 mt-4 block">Recovery note</label><textarea id={id+'-note'} className={field+' '+fieldFocus+' rounded-6 p-3'} maxLength={10000} rows={3} value={note} onChange={e=>{setNote(e.target.value);persist('harness-note',e.target.value);}}/><p className="mt-2 text-12">Saving a note keeps this question open. Choose and apply an action to continue.</p></>:
                <><label htmlFor={id+'-answer'} className="mb-2 mt-4 block">Your answer</label><textarea id={id+'-answer'} className={field+' '+fieldFocus+' rounded-6 p-3'} maxLength={10000} rows={3} value={answers[q?.id]||''} onChange={e=>answer(e.target.value)}/></>}
        </fieldset>
        {notice&&<p role="status" className="my-3">{notice}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
            {onLater&&<Button disabled={busy} onClick={onLater}>Later</Button>}
            {harness?<><Button disabled={busy||!note.trim()||!act} onClick={async()=>{if(await act!({operation:'note',note})){setNotice('Note saved. Apply an available action when ready.');}}}>Save note</Button><Button variant="primary" disabled={busy||!selected||!act} onClick={()=>void act!({operation:'apply',optionId:selected})}>Apply action</Button></>:
                <><Button disabled={busy||step===0} onClick={()=>setStep(n=>n-1)}>Back</Button>{step<questions.length-1?<Button variant="primary" disabled={busy||!answers[q.id]?.trim()} onClick={()=>setStep(n=>n+1)}>Next</Button>:<Button variant="primary" disabled={busy||questions.some(q=>!answers[q.id]?.trim())} onClick={()=>void send()}>Send answers</Button>}</>}
        </div>
    </section>;
}
