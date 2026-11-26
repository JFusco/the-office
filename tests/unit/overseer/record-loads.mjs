// Test support: appends the URL of every module this process loads to the file named by OVERSEER_LOAD_LOG.
import { appendFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

const log = process.env.OVERSEER_LOAD_LOG;
if (log) registerHooks({ load(url, context, nextLoad) { appendFileSync(log, `${url}\n`); return nextLoad(url, context); } });
