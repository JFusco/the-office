import { z } from 'zod';
import type { Store } from './store';
export const PickupSchema=z.object({enabled:z.boolean(),status:z.string().trim().min(1).max(100)}).strict();
export function savePickup(store:Store,input:unknown){
  const c=store.state.coordination;if(!c)throw new Error('Activate Office checkpoints before configuring pickup');
  c.pickup=PickupSchema.parse(input);c.listener.nextCheckAt='';
  store.emit('pickup-configured',`Morgan will ${c.pickup.enabled?'automatically pick up':'only report'} assigned tickets in ${c.pickup.status}.`,'pm');
}
export const PICKUP_CHAT=`LOCAL PICKUP SETTINGS: Only Morgan may return pickupChange={enabled,status}, and only when Joe's CURRENT message explicitly requests changing the automatic pickup rule for this selected project. A question about possibilities/defaults gets pickupChange=null. This changes local Office configuration only; never change Jira/GitHub statuses or assignment from chat. Assignment to Joe remains mandatory. Default GitHub status Ready; CEC To Do. Preserve enabled/status unless Joe requests that field changed. Other roles always return pickupChange=null. Read current settings from Office context; if unclear ask rather than inventing them.`;
