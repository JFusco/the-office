import { expect,it } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { admittedResult } from '../../../../server/knowledge/sources/admitted-result';
import type { SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
it('withholds mixed capture groups without rewriting private acquisition or weakening domain and reference checks',()=>{
 const f=intakeFixture();try{
  const units=[{id:'clean',version:'v1'},{id:'blocked',version:'v1'}] as SourceUnit[];
  f.ledger.put('admission','clean:v1',{state:'admitted'});f.ledger.put('admission','blocked:v1',{state:'blocked'});
  const original={units:units.map(unit=>({id:unit.id,outcome:'proposed' as const,reason:''})),proposals:[{domain:'tooling',body:'PRIVATE MIXED CLAIM',units:['clean','blocked']}]},before=f.ledger.revision();
  const filtered=admittedResult(f.ledger,f.policy,original,units);
  expect(filtered.units.map(unit=>unit.id)).toEqual(['clean']);expect(filtered.result).toMatchObject({proposals:[],units:[{id:'clean',outcome:'deferred'}]});expect(JSON.stringify(filtered.result)).not.toContain('PRIVATE MIXED CLAIM');
  expect(original.proposals).toHaveLength(1);expect(f.ledger.revision()).toBe(before);
  expect(()=>admittedResult(f.ledger,f.policy,{...original,proposals:[{...original.proposals[0],domain:'unregistered'}]},units)).toThrow('invalid-intake-proposal');
  expect(()=>admittedResult(f.ledger,f.policy,{...original,units:[...original.units,original.units[0]]},units)).toThrow('coverage');
 }finally{f.close();}
});
