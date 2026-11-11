import { readFileSync } from 'node:fs';
import { privateFile } from '../../../../server/knowledge/slack-intake/config';
import type { Store } from '../../../../server/store/store';

/** Reads the private per-source report the intake run wrote, for assertions only. */
export function readIntakeReport(store: Store, id: string, _registry: unknown, sourceId: string): string {
    return readFileSync(privateFile(store, `sources/${sourceId}/reports/${id}.json`), 'utf8');
}
