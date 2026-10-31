import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {useSyncExternalStore} from 'react';
vi.mock('react',()=>({useSyncExternalStore:vi.fn((_subscribe,getSnapshot)=>getSnapshot())}));
let monotonic=100;
const dispatch=vi.fn();
beforeEach(()=>{
 vi.resetModules();vi.mocked(useSyncExternalStore).mockClear();dispatch.mockClear();
 vi.useFakeTimers({toFake:['Date','setInterval','clearInterval']});vi.setSystemTime(0);monotonic=100;
 vi.spyOn(performance,'now').mockImplementation(()=>monotonic);
 vi.stubGlobal('window',{dispatchEvent:dispatch});
});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
async function clock(){
 const {useLiveClock}=await import('../../../src/timing/live-clock');useLiveClock();
 const [subscribe,getSnapshot]=vi.mocked(useSyncExternalStore).mock.calls.at(-1)!;
 return {subscribe,getSnapshot};
}
function advance(ms:number){monotonic+=ms;vi.advanceTimersByTime(ms);}
test('delayed first timer mount anchors wall and monotonic together without a false wake',async()=>{
 const c=await clock();advance(6000);const notify=vi.fn(),stop=c.subscribe(notify);
 expect(c.getSnapshot()).toBe(6100);advance(1000);
 expect(notify).toHaveBeenCalledTimes(1);expect(c.getSnapshot()).toBe(7100);expect(dispatch).not.toHaveBeenCalled();stop();
});
test('resubscribe after the final listener leaves reanchors both clocks without a false wake',async()=>{
 const c=await clock(),first=vi.fn(),stop=c.subscribe(first);advance(1000);stop();expect(vi.getTimerCount()).toBe(0);
 advance(25000);const next=vi.fn(),stopAgain=c.subscribe(next);advance(1000);
 expect(first).toHaveBeenCalledTimes(1);expect(next).toHaveBeenCalledTimes(1);expect(dispatch).not.toHaveBeenCalled();stopAgain();
});
test('timer consumers share one interval and stopping one listener leaves the other ticking',async()=>{
 const c=await clock(),first=vi.fn(),second=vi.fn(),stopFirst=c.subscribe(first),stopSecond=c.subscribe(second);
 expect(vi.getTimerCount()).toBe(1);advance(1000);expect(first).toHaveBeenCalledTimes(1);expect(second).toHaveBeenCalledTimes(1);
 stopFirst();advance(1000);expect(first).toHaveBeenCalledTimes(1);expect(second).toHaveBeenCalledTimes(2);expect(dispatch).not.toHaveBeenCalled();
 stopSecond();expect(vi.getTimerCount()).toBe(0);
});
test('a genuine delayed callback after sleep still emits the clock-gap invalidation',async()=>{
 const c=await clock(),stop=c.subscribe(vi.fn());advance(1000);
 // Move both clocks through a suspend while callbacks are unable to run.
 monotonic+=5000;vi.setSystemTime(Date.now()+5000);advance(1000);
 expect(dispatch).toHaveBeenCalledTimes(1);expect(dispatch.mock.calls[0][0].type).toBe('office-clock-gap');stop();
});
test('wall-clock skew still invalidates a live subscription',async()=>{
 const c=await clock(),stop=c.subscribe(vi.fn());advance(1000);vi.setSystemTime(Date.now()+10000);advance(1000);
 expect(dispatch).toHaveBeenCalledTimes(1);expect(dispatch.mock.calls[0][0].type).toBe('office-clock-gap');stop();
});
