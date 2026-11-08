import { execFile } from 'node:child_process';
import { basename } from 'node:path';
import { errno, GroupInventory } from './contract';

export type InventoryRunner = () => Promise<string>;
const execute: InventoryRunner = () => new Promise((resolve, reject) => execFile('/bin/ps', ['-A', '-o', 'pid=,ppid=,pgid=,lstart=,comm='], { timeout: 250, maxBuffer: 2_000_000, env: { ...process.env, LC_ALL: 'C' } }, (error, stdout) => error ? reject(error) : resolve(stdout)));

/** Select only this spawned group; executable basenames are retained, never argv or other groups. */
export async function groupInventory(group: number, run: InventoryRunner = execute): Promise<GroupInventory> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const raw = await Promise.race([run(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject({ code: 'CAPTURE_TIMEOUT' }), 300); })]);
        if (raw.length > 2_000_000) return { status: 'unavailable', errno: 'CAPTURE_LIMIT', members: [], truncated: true };
        const members: GroupInventory['members'] = []; let truncated = false;
        for (const line of raw.split('\n')) {
            const match = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.+?)\s*$/.exec(line);
            if (!match || Number(match[3]) !== group) continue;
            if (members.length === 8) { truncated = true; continue; }
            const member = GroupInventory.shape.members.element.safeParse({ pid: Number(match[1]), ppid: Number(match[2]), pgid: Number(match[3]), startIdentity: match[4].replace(/\s+/g, ' '), executable: basename(match[5]).replace(/[^A-Za-z0-9._+-]/g, '_').slice(0, 80) || 'unknown' });
            if (!member.success) return { status: 'unavailable', errno: 'CAPTURE_INVALID', members: [], truncated: false };
            members.push(member.data);
        }
        return { status: 'observed', members, truncated };
    } catch (error) { return { status: 'unavailable', errno: errno(error), members: [], truncated: false }; }
    finally { clearTimeout(timer); }
}
