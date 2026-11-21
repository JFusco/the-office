import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { NEVER_ENABLED, ResumeControl } from '../../../../server/incidents/repair/resume-control';
import { ControlStore } from '../../../../server/store/control-store';

const AT = new Date('2026-11-21T02:00:00.000Z'), later = (minutes: number) => new Date(AT.getTime() + minutes * 60_000);
const dbs: DatabaseSync[] = [], dirs: string[] = [];
afterEach(() => { dbs.splice(0).forEach(db => { try { db.close(); } catch { /* already closed */ } }); dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })); });
const memory = () => { const db = new DatabaseSync(':memory:'); dbs.push(db); return db; };
const tables = (db: DatabaseSync) => (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map(row => row.name);
const raw = (db: DatabaseSync, revision: unknown, body: string) => {
    db.exec('CREATE TABLE IF NOT EXISTS repair_resume_control (id INTEGER PRIMARY KEY, revision, body TEXT NOT NULL)');
    db.prepare('INSERT OR REPLACE INTO repair_resume_control(id,revision,body) VALUES(1,?,?)').run(revision as number, body);
};

test('it starts paused, and opening or reading it writes nothing', () => {
    const db = memory(), control = new ResumeControl(db);
    expect(control.read()).toEqual({ enabled: false, revision: 0, reason: 'Automatic repair resumes have never been enabled.', at: null });
    expect(control.read()).toBe(NEVER_ENABLED);
    expect(tables(db)).toEqual([]);
});

test('enabling names the revision that was read; a refused change leaves nothing behind', () => {
    const db = memory(), control = new ResumeControl(db);
    expect(() => control.enable(1, 'go', AT)).toThrow('The resume switch is at revision 0, not 1; read it again');
    // Not even the table: the refusal is rolled back whole.
    expect(tables(db)).toEqual([]);
    expect(control.enable(0, 'first fix bound by hand', AT)).toEqual({ enabled: true, revision: 1, reason: 'first fix bound by hand', at: AT.toISOString() });
    expect(control.read()).toEqual({ enabled: true, revision: 1, reason: 'first fix bound by hand', at: AT.toISOString() });
    expect(() => control.enable(0, 'again', later(1))).toThrow('The resume switch is at revision 1, not 0; read it again');
    expect(control.read()).toMatchObject({ revision: 1, reason: 'first fix bound by hand' });
});

test('a pause is always accepted and is itself a change, so an enable that read before it is refused', () => {
    const control = new ResumeControl(memory());
    expect(control.pause('looking at CEC-154', AT)).toEqual({ enabled: false, revision: 1, reason: 'looking at CEC-154', at: AT.toISOString() });
    // Paused again by someone else, while the first reader still holds revision 1.
    expect(control.pause('two rollbacks in a row', later(1))).toEqual({ enabled: false, revision: 2, reason: 'two rollbacks in a row', at: later(1).toISOString() });
    expect(() => control.enable(1, 'done looking', later(2))).toThrow('The resume switch is at revision 2, not 1; read it again');
    expect(control.read()).toMatchObject({ enabled: false, revision: 2, reason: 'two rollbacks in a row' });
    expect(control.enable(2, undefined, later(3))).toEqual({ enabled: true, revision: 3, reason: 'Enabled by request.', at: later(3).toISOString() });
    expect(control.pause(undefined, later(4))).toEqual({ enabled: false, revision: 4, reason: 'Paused by request.', at: later(4).toISOString() });
});

test('a reason is kept as one bounded line with credentials removed', () => {
    const control = new ResumeControl(memory());
    expect(control.pause('  rollback\n\tafter   deploy  ', AT).reason).toBe('rollback after deploy');
    expect(control.pause('token=ghp_abcdefghijklmnopqrstuvwxyz0123456789 leaked', AT).reason).not.toContain('ghp_');
    expect(control.pause('x'.repeat(900), AT).reason).toHaveLength(500);
    expect(control.pause('   ', AT).reason).toBe('Paused by request.');
});

test('a saved switch that cannot be read is paused, and only a pause brings it back', () => {
    for (const [revision, body] of [[3, '{not json'], [3, '{"enabled":"yes","reason":"r","at":"2026-11-21T02:00:00.000Z"}'], [3, '{"enabled":true,"reason":"r","at":"2026-11-21T02:00:00.000Z","extra":1}'], [3, '{"enabled":true,"reason":"r","at":"yesterday"}'], [3, '{"enabled":true}'],
        // Every change is saved with a reason; a row without one was not written by the switch.
        [3, '{"enabled":true,"reason":"","at":"2026-11-21T02:00:00.000Z"}'], [3, '{"enabled":true,"reason":"  \\t ","at":"2026-11-21T02:00:00.000Z"}'], [3, `{"enabled":true,"reason":"${'r'.repeat(501)}","at":"2026-11-21T02:00:00.000Z"}`]] as const) {
        const db = memory(), control = new ResumeControl(db);
        raw(db, revision, body);
        expect(control.read()).toEqual({ enabled: false, revision: 3, reason: 'The saved resume switch cannot be read; automatic repair resumes stay paused until it is paused again.', at: null, invalid: true });
        expect(() => control.enable(3, 'go', AT)).toThrow('The saved resume switch cannot be read; pause it first, then enable it at the revision that pause returns');
        expect(control.read().invalid).toBe(true);
        expect(control.pause('reset', AT)).toEqual({ enabled: false, revision: 4, reason: 'reset', at: AT.toISOString() });
        expect(control.enable(4, 'go', later(1))).toMatchObject({ enabled: true, revision: 5 });
    }
});

test('a saved revision outside the positive safe integers is unreadable, even with a sound body', () => {
    const sound = JSON.stringify({ enabled: true, reason: 'r', at: AT.toISOString() });
    for (const revision of [0, -2, 1.5, 'seven', 1e20]) {
        const db = memory(), control = new ResumeControl(db);
        raw(db, revision, sound);
        const current = control.read();
        expect(current).toMatchObject({ enabled: false, revision: 0, invalid: true });
        expect(() => control.enable(current.revision, 'go', AT)).toThrow('pause it first');
        expect(control.read()).toEqual(current);
        expect(control.pause('reset', AT)).toMatchObject({ enabled: false, revision: 1 });
        expect(control.read()).toEqual({ enabled: false, revision: 1, reason: 'reset', at: AT.toISOString() });
        expect(control.enable(1, 'go', later(1))).toMatchObject({ enabled: true, revision: 2 });
    }
});

test('a database that cannot be read at all is paused, not an error', () => {
    const db = new DatabaseSync(':memory:'), control = new ResumeControl(db);
    control.enable(0, 'go', AT);
    db.close();
    expect(control.read()).toMatchObject({ enabled: false, invalid: true });
});

test('the switch survives ControlStore recovery and a reopened connection', () => {
    const dir = mkdtempSync(join(tmpdir(), 'resume-control-')); dirs.push(dir);
    const path = join(dir, 'office-control.sqlite'), first = new ControlStore(path);
    new ResumeControl(first.db).enable(0, 'go', AT);
    first.recover();
    first.db.close();
    const reopened = new ControlStore(path); dbs.push(reopened.db);
    reopened.recover();
    expect(new ResumeControl(reopened.db).read()).toEqual({ enabled: true, revision: 1, reason: 'go', at: AT.toISOString() });
});
