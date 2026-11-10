import type { KnowledgeOutcome } from './knowledge-outcomes';
export interface KnowledgeDigest extends Pick<KnowledgeOutcome,'lessons'|'evidence'|'sourceBindings'> {
    id:string;projectId:string;weekEnding:string;at:string;from:string;to:string;sha256:string;
    messageId:string;followupIds:string[];
}
export interface KnowledgeDigestDetail extends KnowledgeDigest {text:string}
export interface KnowledgeDigestDelivery {
    enabled:boolean;enabledAt:string;version:string;workspace:string;workspaceId:string;channelId:string;channelName:string;
}
