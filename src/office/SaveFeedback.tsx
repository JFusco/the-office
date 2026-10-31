import {CheckCircle2,AlertCircle,LoaderCircle} from '../ui/icons';
import {cx} from '../ui';
const TONE={pending:'border-feedback-pending-line bg-feedback-pending text-feedback-pending-ink',error:'border-feedback-error-line bg-feedback-error text-feedback-error-ink',success:'border-feedback-line bg-feedback text-feedback-ink'};
export function SaveFeedback({message,error=false,pending=false}:{message:string;error?:boolean;pending?:boolean}){
 if(!message&&!pending)return null;
 const Icon=pending?LoaderCircle:error?AlertCircle:CheckCircle2,tone=pending?'pending':error?'error':'success';
 return <div className={cx('my-3 flex items-start gap-2.5 rounded-8 border px-3.5 py-3 leading-normal',TONE[tone])} data-save-feedback={tone} role={error?'alert':'status'} aria-live={error?'assertive':'polite'}><Icon size={17} className={cx('mt-0.5 flex-none',pending&&'animate-spin reduce-motion:animate-none')}/><div className="flex min-w-0 flex-col gap-0.75"><strong className="text-13">{pending?'Saving…':error?'Could not save':'Saved'}</strong>{message?<span className="text-12 wrap-anywhere">{message.replace(/^(?:Error|TypeError):\s*/,'')}</span>:null}</div></div>;
}
