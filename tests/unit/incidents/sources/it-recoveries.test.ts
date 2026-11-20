import { afterEach, expect, test } from 'vitest';
import { itRecoveries } from '../../../../server/incidents/sources/it-recoveries';
import type { Store } from '../../../../server/store/store';
import { observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }

test('only recoveries handed to a person; a copied detail is of unknown origin, a service probe\'s is the harness\'s', () => {
    const s = store();
    s.state.it = { recoveries: {
        'implementation:job-1': { attempts: 3, nextAt: '', status: 'needs-human', detail: 'Error: writer restart refused for GH-12' },
        'probe:slack': { attempts: 3, nextAt: '', status: 'needs-human', detail: 'Slack returned 503 for auth.test' },
        'checkpoint:cp-1': { attempts: 1, nextAt: 'x', status: 'retrying', detail: 'd' }, 'probe:jira': { attempts: 3, nextAt: '', status: 'resolved', detail: 'd' },
    } } as any;
    expect(itRecoveries(observe(s)).map(f => [f.subject.id, f.subject.episode, f.subject.stage, f.cause.kind, f.cause.author, f.cause.text, f.expected])).toEqual([
        ['implementation:job-1', '3', 'implementation', 'needs-human', 'unknown', '', null],
        ['probe:slack', '3', 'probe', 'needs-human', 'harness', 'slack returned 503 for auth.test', null],
    ]);
    expect(itRecoveries(observe(s))[0].evidence).toBe('Error: writer restart refused for GH-12');
    s.state.it = undefined as any;
    expect(itRecoveries(observe(s))).toEqual([]);
});
