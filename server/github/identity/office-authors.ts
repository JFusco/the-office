import type { EffectIntent } from '../../../src/shared';
import type { Store } from '../../store/store';
import { githubIdentity } from './identity-runtime';
import { resolveWrite } from './write-identity';
import { routeCutover } from './route-activation';
import { routeOf } from './write-inventory';

/** The operator's GitHub login, which every Office write carried before writers were recorded. */
export const OPERATOR_LOGIN = 'JFusco';

/** The author a saved Office record must carry: its recorded writer, or the historical operator for a legacy record. */
export const savedAuthor = (intent: Pick<EffectIntent, 'writer'> | null | undefined): string => intent?.writer?.login ?? OPERATOR_LOGIN;

/**
 * The one login a record of this adapter is expected to carry, without a live viewer read: the saved writer of the
 * Effect when it exists (the historical operator for a legacy one), otherwise the principal the route selects for a
 * new write now. A route that would hold, or a designated trial whose binding is not known yet, expects the operator.
 */
export function expectedAuthor(store: Store, effectId: string, adapter: string): string {
    const saved = store.getEffect(effectId);
    if (saved) return savedAuthor(saved);
    const route = routeOf(store.project, adapter);
    const config = githubIdentity(store).config();
    if (!route || !config) return OPERATOR_LOGIN;
    const decision = resolveWrite(store, config, { effectId, operation: route.operation, binding: { adapter, target: '' } }, { apply: false });
    return decision.kind === 'app' && decision.grant.kind === 'activation' ? config.botLogin : OPERATOR_LOGIN;
}

/** True when the route of this adapter would send a new write as the App now: the reads around it must suit an installation token. */
export const appSelected = (store: Store, adapter: string) => expectedAuthor(store, `${adapter}:probe`, adapter) !== OPERATOR_LOGIN;

/**
 * How a record found only on the provider stands, by its author and creation time. The App's bot is the Office.
 * The operator is the Office for a legacy record: one created before the route first moved to the App. An operator
 * record created after that cutover is ambiguous and is kept for reconciliation, never adopted or duplicated.
 * Anyone else is not the Office. The caller still checks the record's marker, target and assignee.
 */
export function discoveredAuthor(store: Store, adapter: string, login: unknown, createdAt: unknown): 'office' | 'ambiguous' | 'foreign' {
    const bot = githubIdentity(store).config()?.botLogin;
    if (bot && login === bot) return 'office';
    if (login !== OPERATOR_LOGIN) return 'foreign';
    const route = routeOf(store.project, adapter), cutover = route && routeCutover(store, route.operation);
    return !cutover || typeof createdAt === 'string' && Date.parse(createdAt) < Date.parse(cutover) ? 'office' : 'ambiguous';
}

/**
 * Accepted authors for provider-only discovery of an Office record with no saved intent: the operator for legacy
 * records and, once configured, the App's bot. A match still needs the record's marker, target and identity checks.
 */
export function discoveryAuthors(store: Store): string[] {
    const bot = githubIdentity(store).config()?.botLogin;
    return bot ? [OPERATOR_LOGIN, bot] : [OPERATOR_LOGIN];
}
