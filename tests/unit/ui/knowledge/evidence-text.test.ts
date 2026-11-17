import { expect, test } from 'vitest';
import { evidenceText } from '../../../../src/knowledge/evidence-text';

const header = 'repair · accepted · 2026-11-16T19:38:01.512Z · sha256 53814f938153913941cdac807e98a0b3ab24836bb44537ea93a230e95a084a3';
const result = (summary: string) => JSON.stringify({ outcome: 'passed', prerequisites: [], approach: null, summary, commit: 'a'.repeat(40) });

test('evidence saved from a stage result reads as a heading and the opening of its summary, without the hash, JSON or markup', () => {
    const detail = `${header}\n${result('I fixed the saved-spec defect (`CEC154-QA5-REGEN-001`) and committed it as 7d6ce8896da1102af6972afe594e313e36cebbec. The full lane did not pass cleanly. A third sentence.\n\n**What changed**\n- **Cause:** for any saved spec…')}`;
    expect(evidenceText(detail, 'America/New_York')).toEqual({ heading: 'Repair · passed · Nov 16, 2:38 PM',
        text: 'I fixed the saved-spec defect (CEC154-QA5-REGEN-001) and committed it as 7d6ce88. The full lane did not pass cleanly.' });
    expect(evidenceText(`${header.replace('repair', 'repair-review')}\n${result('Approved.')}`, 'America/New_York').heading).toBe('Repair review · passed · Nov 16, 2:38 PM');
});

test('a result cut off mid-way still gives its outcome and whatever of the summary was kept', () => {
    const whole = `${header} ${result('Quoted "text" with a\nline break and a long tail of detail that goes on.')}`;
    const cut = evidenceText(`${whole.slice(0, whole.indexOf('long tail') + 4)}\n[Accepted result excerpt; remainder omitted]`, 'UTC');
    expect(cut.heading).toBe('Repair · passed · Nov 16, 7:38 PM');
    expect(cut.text.startsWith('Quoted "text" with a line break and a long')).toBe(true);
    expect(evidenceText(`${header} {"outcome":"blocked","summary":"Ends on an escape \\`, 'UTC').text).toBe('Ends on an escape');
    expect(evidenceText(`${header} {"outcome":"blocked"`, 'UTC')).toEqual({ heading: 'Repair · blocked · Nov 16, 7:38 PM', text: 'No summary was recorded.' });
    const long = evidenceText(`${header} ${result(`${'word '.repeat(120)}end.`)}`, 'UTC').text;
    expect(long.length).toBeLessThanOrEqual(320); expect(long.endsWith('…')).toBe(true);
});

test('evidence that is not a stage result is shown as it is', () => {
    for (const detail of ['Explicitly promoted by Joe from the reviewed note', 'repair · accepted · not a stored header', 'Pull request 9 review', ''])
        expect(evidenceText(detail)).toEqual({ heading: '', text: detail });
});
