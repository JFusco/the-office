import { expect,it,vi } from 'vitest';
import { withIntakeLaunch } from '../../../server/workers/with-intake-launch';

it('reports a proven pre-spawn failure once even when an inner guard already reports it',async()=>{
    const notSpawned=vi.fn(),launched=vi.fn();
    await expect(withIntakeLaunch({onIntakeNotSpawned:notSpawned,onIntakeLaunch:launched},async options=>{options.onIntakeNotSpawned();throw Error('capacity');})).rejects.toThrow('capacity');
    expect(notSpawned).toHaveBeenCalledOnce();expect(launched).not.toHaveBeenCalled();
});
it('never reports unspawned after a real launch, including a failed launch-accounting callback',async()=>{
    for(const failAccounting of [false,true]){
        const notSpawned=vi.fn();
        await expect(withIntakeLaunch({onIntakeNotSpawned:notSpawned,onIntakeLaunch:()=>{if(failAccounting)throw Error('accounting');}},async options=>{options.onIntakeLaunch();throw Error('provider');})).rejects.toThrow();
        expect(notSpawned).not.toHaveBeenCalled();
    }
});
