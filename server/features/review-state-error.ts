import type {ReviewEvidence} from './review-evidence';
import {FeatureError} from './progression/failure';
export class ReviewStateError extends FeatureError {
    constructor(public evidence:ReviewEvidence){super('review-state','Inspect the current saved independent review state before authorization');}
}
