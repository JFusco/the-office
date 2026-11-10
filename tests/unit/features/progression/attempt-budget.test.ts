import { expect, test } from 'vitest';
import { reserveReplacement, requestReplan, stageBudget } from '../../../../server/features/progression/attempt-budget';
import { fixture } from '../test-store';
test('two shared replacements are durable and deduplicated with 30/120 second delays',()=>{
 const f=fixture();try{ const now=new Date('2026-11-10T12:00:00Z');
 f.store.transaction(()=>expect(reserveReplacement(f.feature,'plan','first',now)).toBe(true));
 expect(f.feature.recovery).toMatchObject({attempts:2,nextAt:'2026-11-10T12:00:30.000Z'});
 expect(reserveReplacement(f.feature,'plan','first',now)).toBe(true); expect(f.feature.recovery!.attempts).toBe(2);
 expect(reserveReplacement(f.feature,'plan','second',now)).toBe(true); expect(f.feature.recovery!.nextAt).toBe('2026-11-10T12:02:00.000Z');
 expect(reserveReplacement(f.feature,'plan','third',now)).toBe(false);
 stageBudget(f.feature,'review'); expect(reserveReplacement(f.feature,'plan','fourth',now)).toBe(false);
 }finally{f.close();}
});
test('one diagnostic and three lifetime replans survive revision changes',()=>{
 const f=fixture();try{ const now=new Date();
 expect(reserveReplacement(f.feature,'discovery','unknown',now,true)).toBe(true);
 expect(reserveReplacement(f.feature,'discovery','unknown2',now,true)).toBe(false);
 for(let i=0;i<3;i++) expect(requestReplan(f.feature,'replan'+i,now,'drift')).toBe(true);
 expect(requestReplan(f.feature,'replan2',now,'drift')).toBe(true);
 expect(requestReplan(f.feature,'replan3',now,'drift')).toBe(false); expect(f.feature.revision).toBe(4); expect(f.feature.lifetimeReplans).toBe(3);
 }finally{f.close();}
});
