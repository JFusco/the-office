import { STAGES, type OfficeSnapshot, type Role, type WorkTime } from './shared';

export type ScenePoint = [number, number, number];
export const SPOTS: Record<Role, ScenePoint> = {
    developer: [-5.7, 0, .8], lead: [-3.1, 0, -3.5], qa: [5.5, 0, -2.1],
    pm: [5.5, 0, 3.7], cto: [-4.5, 0, -2], it: [1.2, 0, -3.5],
};
export const avatarHome = (role: Role): ScenePoint => [SPOTS[role][0], 0, SPOTS[role][2] + .85];
const deliveryRoles = new Set<Role>(['pm', 'developer', 'lead', 'qa']);
const deliveryStage = (work: WorkTime) => deliveryRoles.has(work.role) && !!work.ticket &&
    (!work.lane || work.lane === 'delivery') &&
    ((STAGES as readonly string[]).includes(work.stage) || work.stage.startsWith('github-'));

/** Stage starts are stable identities; heartbeats and UI refreshes cannot invent a handoff. */
export function sceneHandoff(snapshot: OfficeSnapshot): OfficeSnapshot['lastHandoff'] {
    if (snapshot.mode === 'demo') return snapshot.lastHandoff;
    const work = (snapshot.workLog || []).filter(deliveryStage)
        .filter(value => Number.isFinite(Date.parse(value.startedAt)))
        .sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt));
    const current = work.at(-1);
    if (!current || !['running', 'completed'].includes(current.status)) return null;
    const prior = work.slice(0, -1).filter(value => value.ticket === current.ticket).at(-1);
    if (!prior || prior.status !== 'completed' || prior.role === current.role ||
        !Number.isFinite(Date.parse(prior.endedAt)) || Date.parse(prior.endedAt) > Date.parse(current.startedAt)) return null;
    return { at: current.startedAt, from: prior.role, to: current.role, ticket: current.ticket };
}

/** Use the accepted server anchor for live motion, never the browser wall clock. */
export function sceneNow(snapshot: OfficeSnapshot, monotonic: number, wall: number): number | null {
    if (snapshot.mode === 'demo') return wall;
    const anchor = snapshot.liveAnchor, delta = anchor ? monotonic - anchor.receivedAt : -1;
    const server = Date.parse(anchor?.serverTime || '');
    return anchor?.connected && anchor.visible && delta >= 0 && delta <= 35000 && Number.isFinite(server)
        ? server + delta : null;
}

export function handoffPath(role: Role): ScenePoint[] {
    const home = avatarHome(role), side = home[0] < 0 ? -2.5 : 2.5, z = home[2] < 0 ? -.8 : .8;
    return [home, [side, 0, home[2]], [side, 0, z], [Math.sign(side) * 2.15, 0, z]];
}
export const ctoPacingPath = (): ScenePoint[] => [avatarHome('cto'), [-2.7, 0, -1.15], [-2.7, 0, .65], [-.9, 0, .65]];
export const pacingDelay = (first: boolean, random: number) => (first ? 14000 : 45000) + Math.max(0, Math.min(1, random)) * (first ? 6000 : 35000);
const distance = (a: ScenePoint, b: ScenePoint) => Math.hypot(b[0] - a[0], b[2] - a[2]);
export const tripDuration = (path: ScenePoint[], speed = 1.4, hold = .8) => path.slice(1).reduce((total, point, i) => total + distance(path[i], point), 0) / speed * 2 + hold;

/** Constant-speed, out-and-back walk. Sampling is independent of render cadence. */
export function sampleTrip(path: ScenePoint[], age: number, speed = 1.4, hold = .8) {
    const length = path.slice(1).reduce((total, point, i) => total + distance(path[i], point), 0), travel = length / speed;
    if (!Number.isFinite(age) || age < 0 || age >= travel * 2 + hold || !length)
        return { position: path[0], heading: 0, walking: false, done: true };
    const returning = age > travel + hold;
    let remaining = Math.min(length, returning ? length - (age - travel - hold) * speed : age * speed);
    for (let i = 1; i < path.length; i++) {
        const segment = distance(path[i - 1], path[i]);
        if (remaining <= segment && segment || i === path.length - 1) {
            const t = segment ? Math.max(0, Math.min(1, remaining / segment)) : 1, a = path[i - 1], b = path[i];
            return { position: [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t] as ScenePoint,
                heading: Math.atan2(b[0] - a[0], b[2] - a[2]) + (returning ? Math.PI : 0),
                walking: age < travel || returning, done: false };
        }
        remaining -= segment;
    }
    return { position: path[0], heading: 0, walking: false, done: true };
}
