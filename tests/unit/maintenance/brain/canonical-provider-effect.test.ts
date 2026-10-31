import {expect,test} from 'vitest';
import {canonicalProviderEffectIdentity as canonical} from '../../../../server/maintenance/brain/canonical-provider-effect';
const context={repositoryPath:'/configured/brain',originalWorkId:'original-worker-123'};
const fingerprint=(effects:{kind:string;target:string}[])=>JSON.stringify(effects.map(e=>JSON.stringify(canonical(e,context))).sort());
test.each(['/configured/brain: origin','/configured/brain origin'])('binds only exact configured origin form: %s',target=>{
 expect(canonical({kind:'git-fetch',target},context)).toEqual({kind:'git-fetch',target:'/configured/brain: origin'});
});
test.each(['Brain native maintenance/publication claims for original-worker-123','Brain original attempt original-worker-123'])('binds only exact original native claim label: %s',target=>{
 expect(canonical({kind:'native-claim',target},context)).toEqual({kind:'native-claim',target:'Brain native maintenance/publication claims for original-worker-123'});
});
test.each([
 {kind:'git-fetch',target:'/other/brain origin'},
 {kind:'git-fetch',target:'/configured/brain: upstream'},
 {kind:'git-fetch',target:'/configured/brain origin --prune'},
 {kind:'git-fetch',target:'/configured/brain origin '},
 {kind:'git-fetch',target:' /configured/brain origin'},
 {kind:'git-fetch',target:'/configured/brain  origin'},
 {kind:'git-fetch',target:'/configured/brain/../brain origin'},
 {kind:'native-claim',target:'Brain original attempt foreign-worker'},
 {kind:'native-claim',target:'Brain native maintenance/publication claims for foreign-worker'},
 {kind:'native-claim',target:'Brain original attempt original-worker-123 '},
 {kind:'native-claim',target:'Brain claims for original-worker-123'},
 {kind:'native-claim',target:'/configured/brain origin'},
 {kind:'issue-comment',target:'Brain original attempt original-worker-123'},
 {kind:'board-status',target:'/configured/brain origin'},
 {kind:'unknown-effect',target:'Brain original attempt original-worker-123'}
])('preserves unknown/different kind or target verbatim: $kind $target',effect=>{
 expect(canonical(effect,context)).toEqual(effect);
});
test('equivalent observed provider identities compare equally while raw objects remain unchanged',()=>{
 const original=[{id:'raw-fetch-a',kind:'git-fetch',target:'/configured/brain: origin',evidence:'original evidence A'},{id:'raw-claim-a',kind:'native-claim',target:'Brain native maintenance/publication claims for original-worker-123',evidence:'original evidence B'}];
 const alternate=[{id:'raw-fetch-b',kind:'git-fetch',target:'/configured/brain origin',evidence:'alternate evidence A'},{id:'raw-claim-b',kind:'native-claim',target:'Brain original attempt original-worker-123',evidence:'alternate evidence B'}];
 const raw=JSON.stringify([original,alternate]);Object.freeze(original);Object.freeze(alternate);original.forEach(Object.freeze);alternate.forEach(Object.freeze);
 expect(fingerprint(original)).toBe(fingerprint(alternate));expect(JSON.stringify([original,alternate])).toBe(raw);
});
test.each(['extra-comment','different-comment','extra-board','different-board','extra-native-claim','different-original-worker'])('set comparison still detects distinct provider effects: %s',scenario=>{
 const before=[{kind:'git-fetch',target:'/configured/brain: origin'},{kind:'native-claim',target:'Brain native maintenance/publication claims for original-worker-123'},{kind:'issue-comment',target:'https://github.com/Owner/repo/issues/67#issuecomment-1'},{kind:'board-status',target:'https://github.com/users/Owner/projects/8 item item-1'}];
 const after=structuredClone(before);after[0].target='/configured/brain origin';after[1].target='Brain original attempt original-worker-123';
 if(scenario==='extra-comment')after.push({kind:'issue-comment',target:'https://github.com/Owner/repo/issues/67#issuecomment-2'});
 if(scenario==='different-comment')after[2].target='https://github.com/Owner/repo/issues/68#issuecomment-1';
 if(scenario==='extra-board')after.push({kind:'board-status',target:'https://github.com/users/Owner/projects/8 item item-2'});
 if(scenario==='different-board')after[3].target='https://github.com/users/Owner/projects/9 item item-1';
 if(scenario==='extra-native-claim')after.push({kind:'native-claim',target:'Brain original attempt other-worker'});
 if(scenario==='different-original-worker')after[1].target='Brain original attempt other-worker';
 expect(fingerprint(after)).not.toBe(fingerprint(before));
});
test('empty binding context grants no canonical alias',()=>{
 for(const effect of [{kind:'git-fetch',target:' origin'},{kind:'native-claim',target:'Brain original attempt '}])
  expect(canonical(effect,{repositoryPath:'',originalWorkId:''})).toEqual(effect);
});
