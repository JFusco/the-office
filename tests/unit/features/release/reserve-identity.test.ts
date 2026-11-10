import {expect,test} from 'vitest';
import {reserveIdentity} from '../../../../server/features/release/reserve-identity';
import {fixture} from '../test-store';
test('verified identity reservation clears its fence but cannot change a mapped ticket',()=>{
 const f=fixture();try{f.feature.publication=[{id:'one',key:'',fence:true,effects:[]}] as any;
 reserveIdentity(f.store,f.feature.id,'one',{key:'GH-1',url:'https://github.com/JFusco/brain/issues/1'});expect(f.feature.publication[0]).toMatchObject({key:'GH-1',fence:false});
 expect(()=>reserveIdentity(f.store,f.feature.id,'one',{key:'GH-2',url:'other'})).toThrow('conflicting');
 }finally{f.close();}
});
