import type {OfficeSnapshot} from '../shared';
// A backlog assignment is visible for planning, but it is not an outstanding work request.
/** `defaultStatus` is the server-resolved pickup default; the display fallback applies only where the server did not supply one. */
export function deferredPickup(state:OfficeSnapshot,key:string,defaultStatus=state.project?.provider==='azure'?'To Do':'Ready'){
 if(!key)return false;
 const c=state.coordination,issue=c?.listener.assigned.find(i=>i.key===key);
 if(!issue||c?.jobs?.some(j=>j.key===key&&!['completed','cancelled'].includes(j.status))||state.tickets.some(t=>t.key===key&&t.pilot))return false;
 const review=c?.listener.reviews.slice().reverse().find(r=>r.key===key);
 if(review?.workRequested==='manual'&&!['held','cancelled'].includes(review.status))return false;
 return (issue.pickupStatus??issue.status)!==(c?.pickup?.status||defaultStatus);
}
