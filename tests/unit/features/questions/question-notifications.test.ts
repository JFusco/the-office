import {expect,test} from 'vitest';
import {QuestionNotifications} from '../../../../server/features/questions/question-notifications';
import {fixture} from '../test-store';
test('one committed-state observer fans out only projection changes and disposes subscriptions',()=>{
 const f=fixture();try{
 let count=0;const notifications=new QuestionNotifications(()=>f.feature.title);notifications.observe([f.store]);notifications.observe([f.store]);const unsubscribe=notifications.subscribe(()=>count++);
 expect(f.store.commitListeners.size).toBe(1);f.store.transaction(()=>{f.feature.detail='not projected'});expect(count).toBe(0);
 f.store.transaction(()=>{f.feature.title='Updated'});expect(count).toBe(1);notifications.refresh();expect(count).toBe(1);
 unsubscribe();f.store.transaction(()=>{f.feature.title='Later'});expect(count).toBe(1);notifications.dispose();expect(f.store.commitListeners.size).toBe(0);
 }finally{f.close();}
});
