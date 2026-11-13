import type { SuppliedReference } from './supplied-evidence';
/** Names each recorded source by what a person can recognise: the note path or the lesson revision. */
export function RecordedEvidence({ entries = [] }: { entries?: readonly SuppliedReference[] }) {
    return <ul className="mt-3 grid gap-3 break-words text-11 text-muted">{entries.map(({reference},index)=><li key={`${reference.id}:${index}`}>
        <p>{reference.kind === 'brain' ? `Brain note: ${reference.path || 'path not recorded'}` : reference.lesson ? `${reference.lesson.scope === 'office' ? 'Office' : 'Project'} lesson, revision ${reference.lesson.revision}` : 'Recorded source'}</p>
    </li>)}</ul>;
}
