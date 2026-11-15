import { expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { cecPrompt } from '../../../server/cec/prompts/cec';
import { stagePrompt } from '../../../server/delivery/pipeline/stage-prompts';
import { legacyQA, officeValidation, officeQAGuidance } from '../../../server/qa/assignment';
import type { Ticket, TicketJob } from '../../../src/shared';
const ticket=()=>({key:'CEC-900',runId:'unit',attempt:1,commit:'a'.repeat(40),results:{},approach:{plan:'brief',review:'focused',validation:'browser',checks:['Revise selected feedback'],reason:'Changed editor workflow'}} as Ticket);
test('routine QA runs directly with coverage, setup and no nested team',()=>{
    const store=new Store(':memory:');try {
        const t=ticket(),prompt=cecPrompt(store,t,'qa','qa','/tmp/unit');
        expect(prompt).toContain('ONE independent QA agent');expect(prompt).toContain('PHASE 1 — SETUP');
        expect(prompt).not.toContain('Use $qa-team');expect(prompt).not.toContain('Initialize the real harness');
        expect(prompt).toContain('Revise selected feedback');expect(prompt).toContain('Do not fix');
        const job={id:'j',key:'GH-1',head:t.commit,worktree:'/tmp/candidate',stage:'validate',steps:[],approach:t.approach} as unknown as TicketJob;
        expect(stagePrompt({store,project:store.project,job,root:'/tmp/unit',issue:{},readyChecks:false})).toContain('ONE independent QA agent');
    } finally {store.close();}
});
test('a retained native run or explicit retry keeps its exact legacy protocol; a new protocol cannot fall back after failure',()=>{
    const t=ticket();t.results.qa={qaRunDir:'/tmp/old',outcome:'blocked'} as any;
    expect(legacyQA(t,'qa')).toBe(true);t.qaProtocol={qa:'office-v1'};expect(legacyQA(t,'qa')).toBe(false);
    expect(officeQAGuidance(t.key,t.commit,'qa','/tmp/new',t.approach)).toContain('do not overwrite old reports');
});

test('code/API routes stay check-based even when independent retest is assigned',()=>{const t=ticket();t.approach!.validation='developer-checks';expect(officeValidation(t.approach)).toBe('independent-checks');const prompt=officeQAGuidance(t.key,t.commit,'retest','/tmp/new',t.approach);expect(prompt).toContain('validation=independent-checks');expect(prompt).toContain('do not start a preview, browser');expect(officeValidation()).toBe('browser');});
