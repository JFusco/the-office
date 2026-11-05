import { useId, useState } from 'react';
import type { FeatureRound } from '../contracts/features';
import { Button, field, fieldFocus, interactive } from '../ui';
import { draftKey, readDraft, saveDraft } from './question-drafts';

export function QuestionRound({ project, feature, round, busy, submit }: { project: string; feature: string; round: FeatureRound; busy: boolean; submit: (answers: Record<string, string>) => Promise<boolean> }) {
    const id = useId();
    const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(round.questions.map(q => [q.id, readDraft(draftKey(project, feature, round.id, q.id))])));
    const [error, setError] = useState('');
    const change = (id: string, value: string) => {
        setAnswers(current => ({ ...current, [id]: value }));
        try { saveDraft(draftKey(project, feature, round.id, id), value); setError(''); }
        catch { setError('Your browser could not save this draft. Keep this page open until you submit.'); }
    };
    return <form onSubmit={async event => {
        event.preventDefault();
        if (await submit(answers)) for (const q of round.questions) {
            const key = draftKey(project, feature, round.id, q.id);
            if (readDraft(key) === answers[q.id]) localStorage.removeItem(key);
        }
    }}>
        <h3 className="mb-2 text-16 font-bold">Casey needs your input</h3>
        {round.questions.map(q => <fieldset className="my-3 rounded-8 border border-drawer-line p-3" key={q.id} disabled={busy}>
            <legend>{q.question}</legend>
            <p><strong>Recommendation:</strong> {q.recommendation}</p>
            <div className="my-3 flex flex-wrap gap-2">{q.choices.map(choice => <button className={interactive + " rounded-6 border border-drawer-line px-3 py-2 aria-pressed:bg-roster-hover"} key={choice} type="button" aria-pressed={answers[q.id] === choice} onClick={() => change(q.id, choice)}>{choice}</button>)}</div>
            <label htmlFor={id + q.id} className="mt-3 block">Your answer</label><textarea id={id + q.id} className={field + " " + fieldFocus + " rounded-6 p-3"} required maxLength={10000} rows={3} value={answers[q.id] || ''} onChange={e => change(q.id, e.target.value)} />
        </fieldset>)}
        {error && <p role="alert">{error}</p>}
        <Button type="submit" variant="primary" disabled={busy || round.questions.some(q => !answers[q.id]?.trim())}>Send answers</Button>
    </form>;
}
