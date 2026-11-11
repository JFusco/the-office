import {expect,test} from 'vitest';
import {nextQuestion,questionKey} from '../../../../src/features/questions/question-queue';
import type {FeatureQuestionProjection} from '../../../../src/contracts/features';
const row=(projectId:string,roundId:string,createdAt:string):FeatureQuestionProjection=>({projectId,projectName:projectId,featureId:'f',title:'Feature',asker:'product',revision:1,roundId,createdAt,questions:[]});
test('arrival cannot replace open round, Later is round-scoped, disappearance closes before selecting another',()=>{
 const a=row('a','one','2'),b=row('b','one','1'),next=row('a','two','3');
 expect(nextQuestion([a,b],new Set(),a)).toEqual(a);expect(nextQuestion([a,b],new Set())).toEqual(b);
 expect(nextQuestion([a,next],new Set([questionKey(a)]))).toEqual(next);expect(nextQuestion([b],new Set(),a)).toBeUndefined();
});
