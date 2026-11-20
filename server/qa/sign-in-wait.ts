import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { z } from 'zod';
import { safeWebUrl } from '../office/security';
import type { StageResult } from '../../src/shared';

/** The record a QA worker leaves in its run directory when it leaves a browser window open for a person to sign in. */
export const SIGN_IN_WAIT_FILE = 'sign-in-wait.json';
const web = z.string().max(5000).refine(safeWebUrl);
const SignInWaitSchema = z.object({ port: z.number().int().min(1024).max(65535), signInUrl: web, appUrl: web }).strict();
export type SignInWait = z.infer<typeof SignInWaitSchema>;

/** What the QA assignment tells the worker to write; the harness reads nothing else about the window. */
export const SIGN_IN_WAIT_RULE = `SIGN-IN RECORD: When you leave a browser window open for Joe to sign in, also write ${SIGN_IN_WAIT_FILE} in your QA run directory, as JSON with exactly three fields: "port" (the loopback debugging port of that browser, a number; agent-browser get cdp-url shows it), "signInUrl" (the URL of the sign-in page the window shows) and "appUrl" (the URL of the application you were opening). The Office reads only the tab URLs on that port, sees when the window has left the sign-in page for the application, and resumes this work once by itself. Without the file the work waits for Joe to resume it. Write it only for a window that is really open and waiting; never put a credential, token or cookie in it.`;

const inside = (path: string, root: string) => existsSync(path) && existsSync(root) && realpathSync(path).startsWith(realpathSync(root) + sep);

/**
 * The sign-in record of a QA result, or undefined when there is none the harness can use: the result
 * names no run directory, the directory or the file is outside the work's artifact root, or the file
 * is not exactly the three fields above. A worker's own words are never parsed for a window.
 */
export function readSignInWait(result: Pick<StageResult, 'qaRunDir'> | undefined, root: string): SignInWait | undefined {
    if (!result?.qaRunDir) return;
    const file = resolve(result.qaRunDir, SIGN_IN_WAIT_FILE);
    try {
        if (!inside(file, root) || !inside(file, result.qaRunDir) || statSync(file).size > 20000) return;
        const parsed = SignInWaitSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
        return parsed.success ? parsed.data : undefined;
    }
    catch { return; }
}
