// What a finished pass amounts to: the pass record contract and the classification of its exit.
import { boundedString, exactKeys, isCount, isIso, isRfcUuid } from './field-checks.mjs';

const PASS_OUTCOMES = ['stopped', 'paused', 'service-down', 'fenced', 'read-failed', 'idle', 'observing'];

/** server/overseer/runner-state.ts PassRecord, plus the `officeDataRoot` the entry prints. */
export function validPassRecord(record, officeData) {
    const optional = ['selected', 'released', 'cachedHealthAt', 'cachedIncidentsAt', 'note'];
    if (!exactKeys(record, ['pass', 'startedAt', 'endedAt', 'outcome', 'detail', 'officeDataRoot'], optional)) return false;
    if (!isRfcUuid(record.pass) || !isIso(record.startedAt) || !isIso(record.endedAt) || !PASS_OUTCOMES.includes(record.outcome) || !boundedString(record.detail, 500)) return false;
    if (record.officeDataRoot !== officeData) return false;
    if (record.selected !== undefined && !(exactKeys(record.selected, ['incident', 'revision', 'state', 'kept']) && boundedString(record.selected.incident, 100) && isCount(record.selected.revision) && boundedString(record.selected.state, 100) && typeof record.selected.kept === 'boolean')) return false;
    if (record.released !== undefined && !(exactKeys(record.released, ['incident', 'reason']) && boundedString(record.released.incident, 100) && boundedString(record.released.reason, 200))) return false;
    for (const key of ['cachedHealthAt', 'cachedIncidentsAt']) if (record[key] !== undefined && record[key] !== null && !isIso(record[key])) return false;
    return record.note === undefined || boundedString(record.note, 500);
}

/**
 * The kind of a pass that ended by itself, from its exit, its phase markers and its last line.
 * Exit 3 is locked; exit 0 is a success only with a valid record; exit 2, and a failure before the
 * `run` marker, is a startup failure; anything else is an exit failure. An entry without markers
 * is told apart by the pass's own recording-failure message.
 */
export function classify(ended, officeData) {
    const { code: exitCode, signal, phases, stdout, stderr } = ended;
    const sawRun = phases.includes('run'), sawBootstrap = phases.includes('bootstrap'), legacy = !phases.length;
    if (exitCode === 3) return { kind: 'locked', outcome: null };
    if (exitCode === 0) {
        const last = stdout.trim().split('\n').at(-1) ?? '';
        let parsed;
        try { parsed = JSON.parse(last); } catch { parsed = null; }
        return validPassRecord(parsed, officeData) ? { kind: 'success', outcome: parsed.outcome } : { kind: 'exit', outcome: null, detail: 'exit 0 without a valid pass record' };
    }
    if (exitCode === 2) return { kind: 'startup', outcome: null };
    if (exitCode === 1) {
        if (sawRun) return { kind: 'exit', outcome: null };
        if (sawBootstrap) return { kind: 'startup', outcome: null };
        return { kind: legacy && stderr.includes('The pass could not be recorded') ? 'exit' : 'startup', outcome: null };
    }
    if (signal && sawBootstrap && !sawRun) return { kind: 'startup', outcome: null };
    return { kind: 'exit', outcome: null };
}
