import {expect,test} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TicketPlanningAction} from '../../../../src/features/questions/TicketPlanningAction';
import {fixture} from '../../features/test-store';
test('inspector retains manual entry until assessment activation, then distinguishes active enrollment',()=>{
 const f=fixture();try{
 const snapshot={...f.store.state,project:f.store.project};
 const render=()=>renderToStaticMarkup(createElement(TicketPlanningAction,{snapshot,ticket:'GH-1',open:()=>{}}));
 expect(render()).toContain('Plan a feature from this ticket');
 snapshot.featurePlanning={assessment:true,progression:'automatic',policyDigest:'test'};
 expect(render()).toContain('Ask Morgan to assess');
 f.feature.sourceTicket='GH-1';expect(render()).toContain('Open feature plan');
 f.feature.phase='complete';expect(render()).toContain('Ask Morgan to assess');
 snapshot.mode='demo';expect(render()).toContain('disabled=""');
 }finally{f.close();}
});
