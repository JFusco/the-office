import { expect,test } from 'vitest';
import { externalPlanGap } from '../../../server/features/cec-plan-gate';
import { resultGate,publicationEvidenceGap } from '../../../server/cec/workflow';
test('feature enhance uses a bound external plan and never fabricates a Jira update receipt',()=>{
 const ticket={featureBinding:{featureId:'f',approvalId:'a'},externalPlan:{featureId:'f',approvalId:'a',digest:'a'.repeat(64)},approach:{plan:'none',review:'focused'},results:{},findings:[]} as any;
 const result={outcome:'passed',receipts:[],evidence:[],findings:[]} as any;
 expect(externalPlanGap(ticket)).toBe('');expect(resultGate(ticket,'enhance',result,'/tmp')).toBe('');
 ticket.externalPlan.approvalId='other';expect(resultGate(ticket,'enhance',result,'/tmp')).toContain('reference');
 delete ticket.approach;expect(publicationEvidenceGap(ticket,'/tmp')).toContain('reference');
});
