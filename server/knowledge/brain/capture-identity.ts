import type { BrainCaptureReceipt } from './capture-receipt';
/** Capture settlement and later curation must still refer to the original input. */
export function captureIdentityMatches(receipt:BrainCaptureReceipt,expected:{id:string;hash:string;domain:string;receipt?:{id?:string}}):boolean {
    return receipt.found&&receipt.requestId===expected.id&&!!expected.receipt?.id&&receipt.id===expected.receipt.id&&receipt.inputSha256===expected.hash&&receipt.domain===expected.domain;
}
