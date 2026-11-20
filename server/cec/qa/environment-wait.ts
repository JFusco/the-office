import { isSetupStop } from './setup-stop-cap';
import type { StageResult } from '../../../src/shared';

/**
 * A QA run that stopped in setup, tested nothing, and is waiting on its own environment (a browser, a
 * sign-in), not on a decision about the ticket and not on a registered release.
 */
export const environmentWait = (result: StageResult | undefined): boolean =>
    isSetupStop(result) && result!.resolution?.kind === 'provider-wait' && !result!.resolution.release;
