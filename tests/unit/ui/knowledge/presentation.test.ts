import {createElement} from 'react';
vi.mock('../../../../src/knowledge/useKnowledgeView',()=>({useKnowledgeView:(_project:string,route:string)=>({data:route==='activity'?{events:[],supplied:4,retrieved:3,verified:2,limitations:[]}:null,error:'',refresh:()=>{},refreshing:false})}));
import {Activity} from '../../../../src/knowledge/Activity';
import {test,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ActivityTimeline} from '../../../../src/knowledge/ActivityTimeline';
import {KnowledgeReveal} from '../../../../src/knowledge/KnowledgeReveal';
test('groups dated history without dropping evidence actions or unknown application wording',()=>{
    const html=renderToStaticMarkup(createElement(ActivityTimeline,{events:[{id:'a',at:'2026-11-11T12:00:00Z',kind:'supplied',title:'Assignment',detail:'Application unknown',assignmentId:'x'},{id:'b',at:'2026-11-11T13:00:00Z',kind:'curated',title:'Lesson',detail:'Retained'}],onAssignment:()=>{},onDigest:()=>{}}));
    expect(html.match(/<time /g)).toHaveLength(2);expect(html).toContain('Application unknown');expect(html).toContain('Inspect assignment knowledge');expect(html.match(/November 11, 2026/g)).toHaveLength(1);
});
test('does not expose unloaded contents and names the current load operation',()=>{
    const loading=renderToStaticMarkup(createElement(KnowledgeReveal,{ready:false,label:'Loading activity…',children:createElement('p',null,'Private result')}));expect(loading).not.toContain('Private result');expect(loading).toContain('Loading activity…');
    const ready=renderToStaticMarkup(createElement(KnowledgeReveal,{ready:true,label:'Loading activity…',children:createElement('p',null,'Current result')}));expect(ready).toContain('Current result');expect(ready).not.toContain('Loading activity…');
});

test('Activity distinguishes accepted evidence from independently proven application',()=>{
 const html=renderToStaticMarkup(createElement(Activity,{project:'cec'}));
 expect(html).toContain('Accepted citations or confirmed procedures');expect(html).toContain('General application remains unknown.');expect(html).not.toContain('Application independently verified');
});
