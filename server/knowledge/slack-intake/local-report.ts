import { readFileSync } from 'node:fs';
import { privateFile } from './config';
import { projectById, projectData } from '../../office/projects';
/** Local-only operator read: private reports never become API snapshot payloads. */
export function readLocalIntakeReport(project: string, id: string, dataRoot?: string): string {
    if (project !== 'brain' || !/^intake-\d{4}-\d{2}-\d{2}$/.test(id)) throw Error('Invalid private intake report');
    return readFileSync(privateFile({ dataRoot: dataRoot || projectData(projectById('brain')) }, `reports/${id}.json`), 'utf8');
}
