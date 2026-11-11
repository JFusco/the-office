import { expect,it,vi } from 'vitest';
import { sourceFixture } from './source-fixture';
import { recoverStoppedLaunches } from '../../../../server/knowledge/sources/recover-launches';
import type { WorkTime } from '../../../../src/shared';

it('settles a stopped native attempt once, preserving its debit without taxing future days',()=>{const f=sourceFixture();try{
 const attempt=crypto.randomUUID();expect(f.budget.reserve(attempt,f.source.id)).toBe(true);
 expect(recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),()=>false)).toBe(1);expect(recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),()=>false)).toBe(0);expect(f.budget.used('2026-11-06')).toBe(1);
 f.advance(86400000);expect(f.budget.used()).toBe(0);expect(f.budget.reserve(crypto.randomUUID(),f.source.id)).toBe(true);
}finally{f.close();}});
it('charges an unknown cross-midnight launch conservatively on recovery day, but never on later days',()=>{const f=sourceFixture();try{
 const attempt=crypto.randomUUID();f.budget.reserve(attempt,f.source.id);f.advance(86400000);expect(recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),()=>false)).toBe(1);expect(f.budget.used('2026-11-06')).toBe(1);expect(f.budget.used('2026-11-07')).toBe(1);expect(f.registry.meta(`launch-recovery:${attempt}`)).toEqual({reservationDay:'2026-11-06',settledDay:'2026-11-07',additionalConservativeCharge:true});f.advance(86400000);expect(recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),()=>false)).toBe(0);expect(f.budget.used()).toBe(0);
}finally{f.close();}});
it.each(['claim','running','stopping','surviving','unknown'] as const)('never settles a reservation while %s ownership remains possible',state=>{const f=sourceFixture();try{
 const attempt=crypto.randomUUID();f.budget.reserve(attempt,f.source.id);const requestId=`source:${f.source.id}`;
 if(state==='claim')vi.spyOn(f.store,'activeClaims').mockReturnValue([{work:{id:requestId}}] as never);
 else f.store.state.workLog=[{id:'worker',requestId,stage:'knowledge-source-read',status:state==='running'||state==='stopping'?state:'interrupted',processId:999999}] as WorkTime[];
 const alive=vi.fn(()=>true);expect(recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),alive)).toBe(0);expect(f.budget.used()).toBe(1);if(state==='surviving'||state==='unknown')expect(alive).toHaveBeenCalledWith(999999);
}finally{vi.restoreAllMocks();f.close();}});
it('recovers an unbound public-link reservation after stopped ownership, without altering retained links',()=>{const f=sourceFixture();try{
 f.budget.reserve('public-attempt',f.source.id);f.ledger.put('link','retained',{url:'https://www.sqlite.org/docs.html',state:'pending'});f.store.state.workLog=[{id:'public-worker',requestId:`source:${f.source.id}`,stage:'knowledge-source-read',status:'interrupted',processId:999999}] as WorkTime[];const before=f.ledger.all('link');
 expect(recoverStoppedLaunches(f.registry,new Map([['brain',f.store]]),()=>false)).toBe(1);expect(f.ledger.all('link')).toEqual(before);expect(f.budget.used()).toBe(1);f.advance(86400000);expect(f.budget.used()).toBe(0);expect(f.store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
}finally{f.close();}});
