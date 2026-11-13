import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {RecordedEvidence} from '../../../../src/knowledge/content/RecordedEvidence';
it('names every recorded source in plain words and never prints its identity, snapshot or hashes',()=>{
    const entries=[{reference:{id:'lesson:project:unmatched',kind:'lesson' as const,version:'7',lesson:{scope:'project' as const,id:'unmatched',revision:7},contentSha256:'a'.repeat(64)},excerptSha256:'b'.repeat(64)},{reference:{id:'brain:historical',kind:'brain' as const,path:'knowledge/next/caching.md',snapshot:'c'.repeat(40),contentSha256:'d'.repeat(64)},excerptSha256:'e'.repeat(64)},{reference:{id:'lesson:office:legacy',kind:'lesson' as const,contentSha256:'f'.repeat(64)},excerptSha256:'0'.repeat(64)}];
    const html=renderToStaticMarkup(createElement(RecordedEvidence,{entries}));
    expect(html).toContain('Project lesson, revision 7');expect(html).toContain('Brain note: knowledge/next/caching.md');expect(html).toContain('Recorded source');
    expect(html.match(/<li>/g)).toHaveLength(3);
    for(const {reference,excerptSha256} of entries){expect(html).not.toContain(reference.id);expect(html).not.toContain(reference.contentSha256);expect(html).not.toContain(excerptSha256);}
    expect(html).not.toContain('c'.repeat(40));
});
