import type { APIRequestContext } from '@playwright/test';
import type { OfficePreferencesPatch } from '../../src/shared';
import { join } from 'node:path';
/** True when the suite runs against the in-memory fixture server (the default). */
export const fixtureMode=!process.env.OFFICE_TEST_BASE_URL;
/** Screenshot path. Defaults to the historical .local/evidence; set OFFICE_EVIDENCE_DIR to keep runs separate. */
export const evidence=(name:string)=>join(process.env.OFFICE_EVIDENCE_DIR||'.local/evidence',name);
/** Seed office-wide preferences through the synthetic fixture's non-recording endpoint. Call after the automatic reset and before navigation. */
export async function setPreferences(request:APIRequestContext,patch:OfficePreferencesPatch){
  if(!fixtureMode)throw new Error('setPreferences requires the synthetic fixture server');
  const response=await request.post('/__fixture/preferences',{data:patch});
  if(!response.ok())throw new Error(`Fixture preferences were rejected: ${response.status()}`);
}
