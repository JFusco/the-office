import {test,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ActivityTimeline} from '../../../../src/knowledge/ActivityTimeline';
import {KnowledgeReveal} from '../../../../src/knowledge/KnowledgeReveal';
test('groups dated history without dropping evidence actions or unknown application wording',()=>{
    const html=renderToStaticMarkup(<ActivityTimeline events={[{id:'a',at:'2026-11-11T12:00:00Z',kind:'supplied',title:'Assignment',detail:'Application unknown',assignmentId:'x'},{id:'b',at:'2026-11-11T13:00:00Z',kind:'curated',title:'Lesson',detail:'Retained'}]} onAssignment={()=>{}} onDigest={()=>{}}/>);
    expect(html.match(/<time /g)).toHaveLength(2);expect(html).toContain('Application unknown');expect(html).toContain('Inspect assignment knowledge');expect(html.match(/November 11, 2026/g)).toHaveLength(1);
});
test('does not expose unloaded contents and names the current load operation',()=>{
    const loading=renderToStaticMarkup(<KnowledgeReveal ready={false} label="Loading activity…"><p>Private result</p></KnowledgeReveal>);expect(loading).not.toContain('Private result');expect(loading).toContain('Loading activity…');
    const ready=renderToStaticMarkup(<KnowledgeReveal ready label="Loading activity…"><p>Current result</p></KnowledgeReveal>);expect(ready).toContain('Current result');expect(ready).not.toContain('Loading activity…');
});
