import { join } from 'node:path';
/** True when the suite runs against the in-memory fixture server (the default). */
export const fixtureMode=!process.env.OFFICE_TEST_BASE_URL;
/** Screenshot path. Defaults to the historical .local/evidence; set OFFICE_EVIDENCE_DIR to keep runs separate. */
export const evidence=(name:string)=>join(process.env.OFFICE_EVIDENCE_DIR||'.local/evidence',name);
