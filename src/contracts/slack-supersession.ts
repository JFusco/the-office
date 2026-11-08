export interface SlackReplacementRequest { originalDeliveryId: string; reason: string }
/** Audited local closeout; this never claims the original send was delivered. */
export interface SlackSupersession {
    projectId: string;
    replacementDeliveryId: string;
    originalFingerprint: string;
    replacementFingerprint: string;
    contextFingerprint: string;
    reason: string;
    at: string;
}
/** Server-validated presentation, rebuilt from the live receipts for every snapshot. */
export interface SlackSupersessionView {
    replacementDeliveryId: string;
    channelId: string;
    messageTs: string;
    permalink: string;
    reason: string;
}
