import { createHash } from 'node:crypto';
import type { Store } from '../../../store/store';
import type { DependabotAdoption } from '../../../../src/shared';

/** How long a refusal of an unchanged PR stands: evidence outside the row (a parent PR, a tracking issue) is read again after it. */
export const REFUSAL_MEMO_MS = 5 * 60_000;

/** What a bot's refusal depends on in the PR row, and which refusals may be reused. */
export interface RefusalMemo {
    key: (store: Store, pull: any) => string;
    /** False for a refusal on missing or moving evidence (a head that disagrees, incomplete coverage): the next pass qualifies again. */
    reusable: (refusal: string) => boolean;
}

/** A digest of the qualification inputs, so a long PR body is not kept on the record. */
export const memoDigest = (inputs: unknown[]) => createHash('sha256').update(JSON.stringify(inputs)).digest('hex');

/**
 * Whether a refused record's last qualification still answers for this PR row: the same key, dated within
 * REFUSAL_MEMO_MS. Any other record, and an older one without a memo, is qualified live.
 */
export function refusalStands(record: DependabotAdoption | undefined, key: string, now: Date): boolean {
    const memo = record?.status === 'refused' ? record.refusalMemo : undefined, age = now.getTime() - Date.parse(memo?.checkedAt ?? '');
    return !!memo && memo.key === key && age >= 0 && age < REFUSAL_MEMO_MS;
}
