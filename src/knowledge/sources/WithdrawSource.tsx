import { useEffect,useRef } from 'react';
import { Button } from '../../ui';

export function WithdrawSource({title,pending,onConfirm,onCancel}:{title:string;pending:boolean;onConfirm:()=>void;onCancel:()=>void}) {
    const cancel=useRef<HTMLButtonElement>(null);
    useEffect(()=>{cancel.current?.focus();},[]);
    return <section role="region" aria-label={`Confirm withdrawal of ${title}`} className="mt-4 rounded-7 border border-notice-line bg-notice p-4 text-notice-ink">
        <h4 className="font-heading text-15">Withdraw {title}?</h4>
        <p className="my-3 text-11 leading-body">This immediately excludes retained evidence and dependent guidance. Withdrawal is final in this version: the source cannot resume or be added again. Private history is retained.</p>
        <div className="flex flex-wrap gap-2"><Button ref={cancel} disabled={pending} onClick={onCancel}>Cancel withdrawal</Button><Button disabled={pending} onClick={onConfirm}>Confirm permanent withdrawal</Button></div>
    </section>;
}
