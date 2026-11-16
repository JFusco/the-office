import {expect,test} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TicketPlanningAction} from '../../../../src/features/questions/TicketPlanningAction';
import {fixture} from '../../features/test-store';
import {planningAssessable} from '../../../../src/features/questions/planning-assessable';
test('inspector retains manual entry until assessment activation, then distinguishes active enrollment',()=>{
 const f=fixture();try{
 const snapshot={...f.store.state,project:f.store.project};
 const render=()=>renderToStaticMarkup(createElement(TicketPlanningAction,{snapshot,ticket:'GH-1',open:()=>{}}));
 expect(render()).toContain('Plan a feature from this ticket');
 snapshot.featurePlanning={assessment:true,progression:'automatic',policyDigest:'test'};
 expect(render()).toContain('Ask Morgan if this needs feature planning');
 f.feature.sourceTicket='GH-1';expect(render()).toContain('Open feature plan');
 f.feature.phase='complete';expect(render()).toContain('Ask Morgan if this needs feature planning');
 snapshot.mode='demo';expect(render()).toContain('disabled=""');
 }finally{f.close();}
});
test('a ticket already in delivery shows no assessment request, but keeps the link to its feature plan',()=>{
 const f=fixture();try{
 const snapshot:any={...f.store.state,project:f.store.project,featurePlanning:{assessment:true,progression:'automatic',policyDigest:'test'},tickets:[{key:'CEC-154',stage:'repair'},{key:'CEC-200',stage:'plan-review'}]};
 const render=(ticket:string)=>renderToStaticMarkup(createElement(TicketPlanningAction,{snapshot,ticket,open:()=>{}}));
 expect(render('CEC-154')).toBe('');
 expect(render('CEC-200')).toContain('Ask Morgan if this needs feature planning');
 f.feature.sourceTicket='CEC-154';expect(render('CEC-154')).toContain('Open feature plan');
 // Manual planning before assessment is enabled is unchanged.
 delete snapshot.featurePlanning;f.feature.sourceTicket='';expect(render('CEC-154')).toContain('Plan a feature from this ticket');
 }finally{f.close();}
});
test('planning can be assessed until delivery reaches implementation',()=>{
 for(const stage of ['mailbox','understand','enhance','plan','plan-review'])expect(planningAssessable({stage}),stage).toBe(true);
 for(const stage of ['implement','code-review','qa','repair','retest','publish','complete'])expect(planningAssessable({stage}),stage).toBe(false);
 expect(planningAssessable(undefined)).toBe(true);expect(planningAssessable({stage:'review'})).toBe(true);
});
