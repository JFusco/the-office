import {expect,test,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {QuestionStepper} from '../../../../src/features/questions/QuestionStepper';
import {Dialog} from '../../../../src/ui/Dialog';
const question={id:'q',question:'Audience?',recommendation:'Editors',choices:['Editors','Everyone']};
test('initial controls require explicit answers; harness notes have a separate action path',()=>{
 vi.stubGlobal('localStorage',{getItem:()=>null});try{
 const base={project:'brain',feature:'f',busy:false,submit:async()=>true};
 const product=renderToStaticMarkup(createElement(QuestionStepper,{...base,round:{roundId:'r',asker:'product',questions:[question]}}));
 expect(product).not.toContain('checked=""');expect(product).toContain('disabled="">Send answers');
 const harness=renderToStaticMarkup(createElement(QuestionStepper,{...base,round:{roundId:'r',asker:'harness',questions:[question],options:[{id:'retry',label:'Retry once',tradeoff:'Keep history'}]},act:async()=>true}));
 expect(harness).toContain('Recovery note');expect(harness).toContain('Save note');expect(harness).not.toContain('Send answers');expect(harness).not.toContain('checked=""');
 }finally{vi.unstubAllGlobals();}
});
test('native dialog has accessible labels without an author-controlled open attribute',()=>{
 const html=renderToStaticMarkup(createElement(Dialog,{open:true,title:'Questions',description:'Brain / Search',onLater:()=>{},returnFocus:{current:null},children:'Question'}));
 expect(html).toContain('<dialog');expect(html).toContain('aria-labelledby=');expect(html).toContain('aria-describedby=');expect(html).not.toContain(' open=');
});
