import { isDeepStrictEqual } from 'node:util';
import { digest } from '../../store/readback-evidence';
import type { PRMetadataRepair, StaleDescriptionProof } from '../../../src/contracts/pr-metadata';

type Binding = PRMetadataRepair['binding'];
const HEAD = /^[a-f0-9]{40}$/, SHA = /^[a-f0-9]{64}$/;
const keys = (value: object, expected: string[]) => isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort());

/** True when a binding carries no stale-description proof, or exactly the shape a takeover saves for its own head and bytes. */
export function validStaleProof(binding: Binding): boolean {
    const proof: StaleDescriptionProof | undefined = binding.staleDescription;
    if (proof === undefined) return !Object.hasOwn(binding, 'staleDescription');
    const s = proof?.source, r = proof?.revision;
    return !!proof && typeof proof === 'object' && keys(proof, ['route', 'head', 'source', 'contentSha256', 'revision']) && proof.route === 'stale-own-description' &&
        HEAD.test(proof.head) && proof.head !== binding.head && proof.contentSha256 === binding.beforeSha256 && proof.contentSha256 === digest(binding.before) &&
        !!r && keys(r, ['sha256', 'edits', 'lastEditId', 'lastEditedAt']) && SHA.test(r.sha256) && Number.isSafeInteger(r.edits) && r.edits >= 0 &&
        (r.lastEditId === null || typeof r.lastEditId === 'string') && (r.lastEditedAt === null || typeof r.lastEditedAt === 'string') &&
        !!s && (s.kind === 'effect' ? keys(s, ['kind', 'effectId', 'operation']) && !!s.effectId && ['github-pr-create', 'github-pr-metadata', 'ci-pr-metadata'].includes(s.operation)
            : s.kind === 'maintenance' && keys(s, ['kind', 'runId', 'step', 'workerId']) && !!s.runId && Number.isSafeInteger(s.step) && s.step > 0 && !!s.workerId);
}

/**
 * Why a selected assessment cannot refresh a stale own description, or '' when it can. This route refreshes the
 * body alone: no selection, an unchanged body, the captured pair again, or a changed title all leave the
 * description for a person.
 */
export function staleRefreshRefusal(binding: Binding, selected: { title: string; body: string } | null): string {
    if (!binding.staleDescription) return '';
    if (!selected) return 'The stale-description refresh selected no description; a person edits the pull request';
    if (selected.title !== binding.before.title) return 'The stale-description refresh changed the title; this route refreshes only the body';
    if (selected.body === binding.before.body || digest(selected) === binding.beforeSha256) return 'The stale-description refresh left the body unchanged; a person edits the pull request';
    return '';
}
