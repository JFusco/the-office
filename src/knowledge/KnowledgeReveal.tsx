import { createContext, useContext, type ReactNode } from 'react';
export const KnowledgeMotion=createContext(false);
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { LoadingState } from '../ui/LoadingState';
/** Keep the loading footprint, crossfade once, and retain content during same-view refreshes. */
export function KnowledgeReveal({ready,label,children}:{ready:boolean;label:string;children:ReactNode}) {
    const system=useReducedMotion(),reduced=useContext(KnowledgeMotion)||system;
    return <div className="relative min-h-80" data-knowledge-reveal>
        <AnimatePresence initial={false}>
            {!ready&&<motion.div key="loading" className="absolute inset-x-0 top-0" initial={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.16}}><LoadingState panel className="min-h-80">{label}</LoadingState></motion.div>}
        </AnimatePresence>
        {ready&&<motion.div data-knowledge-ready className="space-y-section-gap [&>[data-knowledge-section]:nth-child(2)]:[animation-delay:40ms] [&>[data-knowledge-section]:nth-child(3)]:[animation-delay:80ms]" initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.22,ease:'easeOut'}}>{children}</motion.div>}
    </div>;
}
