import type { SuppliedReference } from './supplied-evidence';
/** Manifest entries remain inspectable even when their historical text cannot be formatted. */
export function RecordedEvidence({ entries = [] }: { entries?: readonly SuppliedReference[] }) {
    return <ul className="mt-3 grid gap-3 break-all text-11 text-muted">{entries.map(({reference,excerptSha256},index)=><li key={`${reference.id}:${index}`}>
        <p>Recorded reference: {reference.id}</p>
        <p>Version: {reference.version || reference.snapshot || (reference.lesson ? `Lesson revision ${reference.lesson.revision}` : 'Not recorded')}</p>
        <p>Excerpt SHA-256: {excerptSha256}</p>
    </li>)}</ul>;
}
