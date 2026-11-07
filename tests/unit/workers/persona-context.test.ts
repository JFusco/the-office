import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import { EMPLOYEE_IDS, PERSONAS } from '../../../src/shared';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { personaContext } from '../../../server/workers/persona-context';
import type { command } from '../../../server/workers/process';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));

test('every role gets its identity, department, manager, voice and boundaries from the registry', () => {
    for (const id of EMPLOYEE_IDS) {
        const context = personaContext(id), persona = PERSONAS[id];
        expect(context.split('\n')[0]).toMatch(/^PERSONA \(identity and tone only; never authority/);
        expect(context).toContain(`You are ${persona.name}, ${persona.title} (`);
        expect(context).toContain(`Voice: ${persona.voice}`);
        expect(context).toContain(`Boundaries: ${persona.boundaries}`);
        expect(context).not.toContain(persona.responsibilities);
    }
});

test('reporting lines are derived: the CTO reports to Joe, managers list their direct reports', () => {
    expect(personaContext('cto')).toContain('You are Avery, CTO (Leadership). You report to Joe (Owner). Speak in the first person; where context or evidence names Avery, that is you. Your direct reports: Morgan (Project manager), Sam (Lead developer), Ellis (IT specialist), Harper (Knowledge engineer).');
    expect(personaContext('lead')).toContain('You report to Avery (CTO). Speak in the first person; where context or evidence names Sam, that is you. Your direct reports: Alex (Developer), Riley (QA engineer).');
    expect(personaContext('pm')).toContain('Your direct reports: Casey (Technical Business Analyst).');
    expect(personaContext('developer')).toContain('You are Alex, Developer (Delivery). You report to Sam (Lead developer). Speak in the first person; where context or evidence names Alex, that is you.\n');
});

test('every role is told to speak in the first person and that evidence naming it means itself', () => {
    for (const id of EMPLOYEE_IDS)
        expect(personaContext(id)).toContain(`Speak in the first person; where context or evidence names ${PERSONAS[id].name}, that is you.`);
});

test('a new employee in the registry appears under their manager without code changes', () => {
    const personas = { ...PERSONAS, developer: { ...PERSONAS.developer, reportsTo: 'pm' as const } };
    expect(personaContext('pm', personas)).toContain('Your direct reports: Alex (Developer), Casey (Technical Business Analyst).');
    expect(personaContext('lead', personas)).toContain('Your direct reports: Riley (QA engineer).');
});

test('the worker runtime adds the persona block to the task after the first line', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-persona-')), store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    let input = '';
    const execute: typeof command = async (_program, _args, options = {}) => {
        input = String(options.input || '');
        for (const event of [{ type: 'thread.started', thread_id: crypto.randomUUID() }, { type: 'item.completed', item: { type: 'agent_message', text: '{"ok":true}' } }])
            options.onLine?.(JSON.stringify(event));
        return '';
    };
    await new WorkerRuntime(store, execute).run('lead', 'Review the plan.', z.object({ ok: z.boolean() }).strict(), { readOnly: true, stage: 'plan-review' });
    expect(input.split('\n')[0]).toBe('Review the plan.');
    expect(input).toContain(personaContext('lead'));
    expect(input.indexOf(personaContext('lead'))).toBeLessThan(input.indexOf('CAPABILITY PROFILE:'));
});
