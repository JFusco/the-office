import { expect,it } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { admittedResult } from '../../../../server/knowledge/sources/admitted-result';
import type { SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
it('withholds blocked units without rewriting private acquisition or weakening coverage checks',()=>{
 const f=intakeFixture();try{
  const units=[{id:'clean',version:'v1'},{id:'blocked',version:'v1'}] as SourceUnit[];
  f.ledger.put('admission','clean:v1',{state:'admitted'});f.ledger.put('admission','blocked:v1',{state:'blocked'});
  const original={units:units.map(unit=>({id:unit.id,outcome:'evidence' as const,reason:unit.id==='blocked'?'PRIVATE BLOCKED CLAIM':''}))},before=f.ledger.revision();
  const filtered=admittedResult(f.ledger,original,units);
  expect(filtered.units.map(unit=>unit.id)).toEqual(['clean']);expect(filtered.result).toEqual({units:[{id:'clean',outcome:'evidence',reason:''}]});expect(JSON.stringify(filtered.result)).not.toContain('PRIVATE BLOCKED CLAIM');
  expect(original.units).toHaveLength(2);expect(f.ledger.revision()).toBe(before);
  expect(()=>admittedResult(f.ledger,{...original,units:[...original.units,original.units[0]]},units)).toThrow('coverage');
 }finally{f.close();}
});
