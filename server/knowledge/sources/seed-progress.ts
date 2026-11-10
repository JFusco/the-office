import type { SlackSeedProgress } from '../../../src/contracts/knowledge';
import type { CollectionPolicy } from './collection-policy';
import type { SourceRegistry } from './registry';
import { completeSeedMember,sourceLaunchLimit } from './seed-budget';
import { IntakeLedger } from '../slack-intake/ledger';
import type { ChannelProgress,ReadTask,SourceUnit,Proposal } from '../slack-intake/contracts';
import type { LinkRecord } from '../slack-intake/read-links';
import { intakeProgress,terminalDeferred } from '../slack-intake/progress';
import { compareTs } from '../slack-intake/timestamps';
export interface SourceSeedRows {tasks:ReadTask[];units:SourceUnit[];links:LinkRecord[];proposals:Proposal[]}
/** Same completion contract as merged seed PR #112, bound to one immutable registry source. */
export function sourceSeedProgress(registry:SourceRegistry,ledger:IntakeLedger,policy:CollectionPolicy,rows?:SourceSeedRows,terminal?:Set<string>):SlackSeedProgress {
    const channel=ledger.get<ChannelProgress>('channel',policy.channels[0].id),key=channel?`${policy.sourceDigest}:${channel.seedUpperTs}`:'';
    const retained=key?ledger.get<SlackSeedProgress>('seed-completion',key):undefined;
    if(retained){completeSeedMember(registry,policy.sourceId,policy.sourceDigest,retained.completedAt!);return {...retained,dailyLimit:8};}
    const {tasks,units,links,proposals}=rows||{tasks:ledger.all<ReadTask>('task'),units:ledger.all<SourceUnit>('unit'),links:ledger.all<LinkRecord>('link'),proposals:ledger.all<Proposal>('proposal')};
    const progress=intakeProgress(tasks,units,links,proposals,terminal||terminalDeferred(ledger,units,tasks));
    const identity=ledger.get<{sourceDigest:string}>('identity',policy.channels[0].id);
    const reads=tasks.filter(t=>!t.processing&&t.sourceId===policy.sourceId&&t.sourceDigest===policy.sourceDigest&&t.channel===policy.channels[0].id);
    const caughtUp=!!channel?.enumerated&&!!channel.caughtUp&&identity?.sourceDigest===policy.sourceDigest
        &&['channel','inventory'].every(kind=>reads.some(t=>t.kind===kind&&!t.resource&&t.oldest==='0.000000'&&t.latest===channel.seedUpperTs&&t.status==='complete'))
        &&['channel','search','inventory'].every(kind=>reads.some(t=>t.kind===kind&&compareTs(t.latest,channel.seedUpperTs)>0&&t.status==='complete'));
    const stale=tasks.some(t=>t.sourceDigest!==policy.sourceDigest&&t.status!=='complete')||proposals.some(p=>p.sourceDigest!==policy.sourceDigest&&['pending','unresolved'].includes(p.status));
    const done=!!key&&caughtUp&&!stale&&progress.outstanding===0;
    const summary:SlackSeedProgress={status:done?'complete-with-gaps':stale||progress.needsAttention?'needs-attention':'seeding',channelsTotal:1,channelsEnumerated:channel?.enumerated?1:0,pendingReads:progress.pendingReads,pendingCaptures:progress.pendingCaptures,unresolvedSources:progress.unresolvedSources,coverageGaps:progress.gaps+4,dailyLimit:done?8:sourceLaunchLimit(registry,policy.sourceId)};
    if(done){summary.completedAt=ledger.store.clock.now().toISOString();ledger.put('seed-completion',key,summary);completeSeedMember(registry,policy.sourceId,policy.sourceDigest,summary.completedAt);}
    return summary;
}
