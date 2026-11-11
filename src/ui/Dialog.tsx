import {useEffect,useId,useRef,type ReactNode,type RefObject} from 'react';
export function Dialog({open,title,description,onLater,returnFocus,children}:{open:boolean;title:string;description:string;onLater:()=>void;returnFocus:RefObject<HTMLElement|null>;children:ReactNode}) {
    const ref=useRef<HTMLDialogElement>(null),invoker=useRef<HTMLElement|null>(null),id=useId();
    useEffect(()=>{
        const dialog=ref.current;if(!dialog)return;
        if(open&&!dialog.open){const active=document.activeElement;invoker.current=active instanceof HTMLElement&&active!==document.body&&active!==document.documentElement?active:null;dialog.showModal();dialog.querySelector<HTMLElement>('[data-question-focus]')?.focus();}
        if(!open&&dialog.open){dialog.close();(invoker.current?.isConnected?invoker.current:returnFocus.current)?.focus();}
    },[open,returnFocus]);
    useEffect(()=>{const dialog=ref.current;return ()=>{if(dialog?.open){dialog.close();(invoker.current?.isConnected?invoker.current:returnFocus.current)?.focus();}};},[returnFocus]);
    return <dialog ref={ref} data-office-question-dialog aria-labelledby={id+'-title'} aria-describedby={id+'-description'} onCancel={event=>{event.preventDefault();onLater();}} className="m-auto max-h-[90dvh] w-[min(42rem,calc(100%_-_2rem))] overflow-y-auto rounded-12 border border-drawer-line bg-paper p-6 text-ink shadow-xl backdrop:bg-black/40 max-compact:p-4">
        <h2 id={id+'-title'} className="text-22 font-bold">{title}</h2><p id={id+'-description'} className="mb-5 mt-2 text-13">{description}</p>{children}
    </dialog>;
}
