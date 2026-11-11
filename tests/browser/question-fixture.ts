import type {OfficeSnapshot} from '../../src/shared';
import type {FeatureQuestionProjection} from '../../src/contracts/features';
import {pendingRounds,roundAuthor} from '../../src/features/questions/pending-round';
import {normalizeQuestion} from '../../src/features/questions/normalize-question';
/** Synthetic visibility is controlled by fixture metadata; real source authorization has isolated server tests. */
export function fixtureQuestions(snapshots:OfficeSnapshot[]):FeatureQuestionProjection[]{return snapshots.flatMap(snapshot=>!snapshot.featurePlanning?.assessment&&snapshot.featurePlanning?.progression!=='automatic'?[]:(snapshot.features||[]).filter(f=>f.status==='waiting'&&!f.paused).flatMap(f=>pendingRounds(f).map(r=>({projectId:f.projectId,projectName:snapshot.project!.name,ticket:f.sourceTicket||undefined,featureId:f.id,title:f.title,asker:roundAuthor(r),revision:f.revision,roundId:r.id,createdAt:r.createdAt,questions:r.questions.map(q=>normalizeQuestion(q,q.id)),options:r.options?.map(({id,label,tradeoff})=>({id,label,tradeoff})) }))));}
