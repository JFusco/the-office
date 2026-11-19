import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { StageResult, WorkApproach } from '../../../src/shared';
import { officeQAEvidenceGap, QA_GATE_REFUSALS } from '../../../server/qa/report-evidence';
import { saveQAReport } from '../../../server/qa/save-report';
import { qaCriteria } from '../../../server/qa/criteria';
const roots:string[]=[];afterEach(()=>roots.splice(0).forEach(r=>rmSync(r,{recursive:true,force:true})));
function fixture(browser=false) {
    const root=mkdtempSync(resolve(tmpdir(),'office-qa-unit-'));roots.push(root);const directory=resolve(root,'office-qa','qa-1'),head='a'.repeat(40);
    const approach:WorkApproach={plan:'none',review:'focused',validation:browser?'browser':'independent-checks',checks:['Required acceptance'],reason:'Unit only'};
    const file=resolve(root,'checks.txt');writeFileSync(file,'Synthetic check evidence');
    const r:StageResult={outcome:'passed',commit:head,summary:'Synthetic fixture',findings:[],receipts:[],paidRuns:0,blocker:'',branch:'',worktree:'',prId:0,previewUrl:'',qaRunDir:directory,evidence:[{id:'check',kind:'checks',commit:head,path:file,url:'',environment:'unit',summary:'Synthetic checks',observedAt:''}],qa:{version:1,ticket:'CEC-900',commit:head,stage:'qa',validation:approach.validation as 'browser'|'independent-checks',setup:{status:'ready',summary:'Synthetic setup',owner:'Riley',nextAction:'Run checks',url:'',actor:'',resources:[]},cases:[{id:'AC1',kind:'acceptance',check:'Required acceptance',status:'passed',expected:'Expected',observed:'Observed fixture',evidenceIds:['check']},{id:'REG1',kind:'regression',check:'Adjacent error handling',status:'passed',expected:'Expected',observed:'Observed fixture',evidenceIds:['check']}],nextOwner:'Morgan',nextAction:'Check delivery gates'}};
    const expected={key:'CEC-900',head,stage:'qa',approach};return {root,directory,r,expected,gap:()=>officeQAEvidenceGap(r,expected,root),save:()=>saveQAReport(r,directory,root)};
}
test('accepts exact-head complete independent coverage and refuses overwriting a prior report',()=>{
    const f=fixture();expect(f.gap()).toContain('missing');f.save();expect(f.gap()).toBe('');f.save();f.r.qa!.nextAction='Changed';expect(()=>f.save()).toThrow('Prior Office QA');
});
test.each(['blocked','failed','not-tested'] as const)('does not turn %s coverage into a pass',status=>{const f=fixture();f.r.qa!.cases[0].status=status;f.save();expect(f.gap()).toContain('untested');});
test('setup block names owner/action; omission, missing evidence and changed identities cannot pass',()=>{
    const f=fixture();f.r.qa!.setup.status='blocked';f.r.qa!.setup.nextAction='Sign in to the visible browser';f.save();expect(f.gap()).toContain('Setup needed: Sign in');
    for(const mutate of [(g:ReturnType<typeof fixture>)=>g.r.qa!.cases.shift(),(g:ReturnType<typeof fixture>)=>g.r.qa!.cases.pop(),(g:ReturnType<typeof fixture>)=>g.r.evidence[0].commit='b'.repeat(40),(g:ReturnType<typeof fixture>)=>g.r.qa!.commit='b'.repeat(40),(g:ReturnType<typeof fixture>)=>g.r.paidRuns=null]){const g=fixture();mutate(g);g.save();expect(g.gap()).not.toBe('');}
});
test('browser passes need actual browser, actor, ownership and saved screenshot in addition to checks',()=>{
    const f=fixture(true);f.save();expect(f.gap()).toContain('browser');
    const g=fixture(true);g.r.qa!.setup={...g.r.qa!.setup,url:'http://127.0.0.1:3000',actor:'Synthetic test actor',resources:['Synthetic owned resource']};
    g.r.evidence.push({...g.r.evidence[0],id:'browser',kind:'browser',url:g.r.qa!.setup.url},{...g.r.evidence[0],id:'png',kind:'screenshot'});g.save();expect(g.gap()).toBe('');
});
test('symlinked report directories cannot escape the assignment',()=>{const f=fixture(),outside=mkdtempSync(resolve(tmpdir(),'office-qa-outside-'));roots.push(outside);mkdirSync(resolve(f.root,'office-qa'));symlinkSync(outside,f.directory);expect(()=>f.save()).toThrow('escaped');});
test('a passed worker cannot change its own selected checks after testing',()=>{const f=fixture();f.r.approach={...f.expected.approach,checks:['Different smaller scope']};f.save();expect(f.gap()).toContain('explicit reroute');});
test('independent checks cannot pass from a differently typed artifact',()=>{const f=fixture();f.r.evidence[0].kind='review';f.save();expect(f.gap()).toContain('focused check output');});
test('browser QA retains the allowed-origin rule',()=>{const f=fixture(true);f.r.qa!.setup.url='http://untrusted.example.test';f.r.qa!.setup.actor='Unit actor';f.r.qa!.setup.resources=['Owned unit resource'];f.r.evidence.push({...f.r.evidence[0],id:'browser',kind:'browser',url:f.r.qa!.setup.url},{...f.r.evidence[0],id:'png',kind:'screenshot'});f.save();expect(f.gap()).toContain('browser');});

test('an independent retest of a developer-checks route needs checks, not a browser',()=>{const f=fixture();f.expected.approach.validation='developer-checks';f.save();expect(f.gap()).toBe('');});

function current(f: ReturnType<typeof fixture>) {
    f.r.qa!.version = 2;
    f.r.qa!.cases[0].criterionId = qaCriteria(f.expected.approach.checks)[0].id;
    f.r.qa!.cases[1].criterionId = null;
    return f;
}
test('v2 covers the saved requirement by stable reference while QA explains it in its own words', () => {
    const f = current(fixture()); f.r.qa!.cases[0].check = 'Observed the required behavior through an independent check';
    f.save(); expect(f.gap()).toBe('');
});
test('v2 accepts further acceptance cases with no reference, beside the referenced case for every saved check', () => {
    const f = current(fixture());
    f.r.qa!.cases.push({ ...f.r.qa!.cases[0], id: 'ticket-criterion', check: 'A ticket criterion that is not a saved check', criterionId: null });
    f.save(); expect(f.gap()).toBe('');
    // They do not stand in for the referenced case, and they must pass like any other.
    const g = current(fixture());
    g.r.qa!.cases.push({ ...g.r.qa!.cases[0], id: 'ticket-criterion', criterionId: null }); g.r.qa!.cases[0].criterionId = null;
    g.save(); expect(g.gap()).toBe('QA must cover every saved required check');
    const h = current(fixture());
    h.r.qa!.cases.push({ ...h.r.qa!.cases[0], id: 'ticket-criterion', criterionId: null, status: 'failed' });
    h.save(); expect(h.gap()).toContain('failing');
});
test.each(['unknown', 'regression-as-acceptance', 'regression-unknown'] as const)('v2 refuses a reference that is not a saved check on an acceptance case: %s', kind => {
    const f = current(fixture());
    if (kind === 'unknown') f.r.qa!.cases.push({ ...f.r.qa!.cases[0], id: 'extra', criterionId: 'unassigned' });
    if (kind === 'regression-as-acceptance') f.r.qa!.cases[1].criterionId = f.r.qa!.cases[0].criterionId;
    if (kind === 'regression-unknown') f.r.qa!.cases[1].criterionId = 'unassigned';
    f.save(); expect(f.gap()).toBe('QA criterion references must match the saved acceptance baseline');
});
test.each(['missing', 'unknown', 'changed-baseline', 'regression-as-acceptance'] as const)('v2 cannot lose coverage through %s', kind => {
    const f = current(fixture());
    if (kind === 'missing') f.r.qa!.cases[0].criterionId = null;
    if (kind === 'unknown') f.r.qa!.cases.push({ ...f.r.qa!.cases[0], id: 'extra', criterionId: 'unassigned' });
    if (kind === 'changed-baseline') f.expected.approach.checks[0] = 'A different requirement';
    if (kind === 'regression-as-acceptance') f.r.qa!.cases[1].criterionId = f.r.qa!.cases[0].criterionId;
    f.save(); expect(f.gap()).not.toBe('');
});
test('v2 still rejects the wrong head and missing evidence; v1 retains its original exact-text rule', () => {
    const f = current(fixture()); f.r.qa!.commit = 'b'.repeat(40); f.save(); expect(f.gap()).toContain('does not match');
    const g = current(fixture()); g.r.qa!.cases[0].evidenceIds = []; g.save(); expect(g.gap()).toContain('current-head evidence');
    const h = fixture(); h.r.qa!.cases[0].check = 'Different wording'; h.save(); expect(h.gap()).toContain('every saved required check');
});

test('the list of what the gate can say names every fixed refusal in its source, and nothing else', () => {
    const source = readFileSync(resolve(__dirname, '../../../server/qa/report-evidence.ts'), 'utf8');
    const said = [...source.matchAll(/return '([^']+)'/g)].map(match => match[1]);
    expect([...new Set(said)].sort()).toEqual([...QA_GATE_REFUSALS].sort());
});
