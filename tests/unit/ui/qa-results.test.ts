import { createElement } from 'react';
import { expect,test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QAResultsCard } from '../../../src/work/QAResultsCard';
import { qaStatus } from '../../../src/work/qa-results';
import { qaResultChanges } from '../../../src/work/qa-notifications';
const head='a'.repeat(40),result={commit:head,outcome:'blocked',summary:'Needs a signed-in editor',blocker:'Sign in',findings:[],evidence:[],qaRunDir:'/tmp/run',qa:{setup:{status:'blocked',summary:'Browser open',owner:'Joe',nextAction:'Sign in to Chrome for Testing'},cases:[{id:'AC1',check:'Revise feedback',status:'not-tested',expected:'Saved revision',observed:'Access unavailable'}]}} as any;
const ticket={key:'CEC-900',commit:head,activity:'blocked',stage:'retest',blocker:'Sign in',results:{qa:{...result,outcome:'failed'},retest:result}} as any;
test('setup, untested coverage, full report, owner and preserved prior results appear together',()=>{
    const html=renderToStaticMarkup(createElement(QAResultsCard,{ticket}));
    for(const text of ['QA Results','Setup needed','Joe','Sign in to Chrome','Not tested','View full report','Earlier QA attempts','Build tested'])expect(html).toContain(text);
    expect(qaStatus({...result,outcome:'passed'},'b'.repeat(40))).toBe('Earlier build');
});
test('QA notification only follows an actual new result in the same project',()=>{
    const before={project:{id:'cec'},tickets:[{...ticket,results:{}}]} as any,after={...before,tickets:[ticket]};
    expect(qaResultChanges(before,after)).toEqual([{key:'CEC-900',text:'CEC-900: QA setup needs help — View results'}]);
    expect(qaResultChanges(after,after)).toEqual([]);expect(qaResultChanges({...before,project:{id:'brain'}},after)).toEqual([]);
});
