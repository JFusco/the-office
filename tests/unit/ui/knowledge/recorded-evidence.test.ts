import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {RecordedEvidence} from '../../../../src/knowledge/content/RecordedEvidence';
it('retains every recorded identity, version and excerpt hash without depending on text formatting',()=>{
    const entries=[{reference:{id:'source:unmatched',kind:'source' as const,version:'v7',contentSha256:'a'.repeat(64)},excerptSha256:'b'.repeat(64)},{reference:{id:'brain:historical',kind:'brain' as const,snapshot:'c'.repeat(40),contentSha256:'d'.repeat(64)},excerptSha256:'e'.repeat(64)}];
    const html=renderToStaticMarkup(createElement(RecordedEvidence,{entries}));
    for(const {reference,excerptSha256} of entries){expect(html).toContain(reference.id);expect(html).toContain(reference.version||reference.snapshot);expect(html).toContain(excerptSha256);}
});
