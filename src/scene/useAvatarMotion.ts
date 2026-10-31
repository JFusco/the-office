import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import type { Agent, OfficeSnapshot } from '../shared';
import { SPOTS, avatarHome, ctoPacingPath, handoffPath, pacingDelay, sampleTrip, sceneHandoff, sceneNow, tripDuration } from './scene-motion';

/** Decorative motion never changes assignments, availability, or recorded work. */
export function useAvatarMotion(agent: Agent, snapshot: OfficeSnapshot, enabled: boolean, body: RefObject<Group | null>,
    arms: RefObject<Group | null>[], legs: RefObject<Group | null>[], party = false) {
    const { invalidate } = useThree(), home = useMemo(() => avatarHome(agent.id), [agent.id]);
    const handoff = sceneHandoff(snapshot), pacing = useMemo(ctoPacingPath, []);
    const path = useMemo(() => handoff && (handoff.from === agent.id || handoff.to === agent.id)
        ? handoffPath(agent.id) : null, [agent.id, handoff?.at, handoff?.from, handoff?.to]);
    const [outing, setOuting] = useState(false), started = useRef(0), settled = useRef(false);
    useEffect(() => {
        setOuting(false); settled.current = false;
        if (!enabled || agent.id !== 'cto' || agent.activity === 'disconnected') return;
        let timer: ReturnType<typeof setTimeout>;
        const schedule = (first: boolean) => { timer = setTimeout(() => {
            started.current = performance.now(); setOuting(true); invalidate();
            timer = setTimeout(() => { setOuting(false); schedule(false); invalidate(); }, tripDuration(pacing) * 1000);
        }, pacingDelay(first, Math.random())); };
        const visibility = () => { clearTimeout(timer); setOuting(false); if (!document.hidden) schedule(true); invalidate(); };
        if (!document.hidden) schedule(true);
        document.addEventListener('visibilitychange', visibility);
        return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', visibility); };
    }, [enabled, agent.id, agent.activity === 'disconnected', pacing, invalidate]);
    useEffect(() => { settled.current = false; invalidate(); }, [enabled, handoff?.at, path, outing, invalidate]);
    useFrame((state) => {
        if (!body.current) return;
        const phase = state.clock.elapsedTime * 7 + Object.keys(SPOTS).indexOf(agent.id) * 1.7;
        if (party && enabled && !document.hidden) {
            body.current.position.set(home[0] + Math.sin(phase * .5) * .12, Math.abs(Math.sin(phase)) * .65, home[2]);
            body.current.rotation.set(0, Math.sin(phase * .5) * .55, Math.sin(phase) * .12);
            arms.forEach((arm, i) => { if (arm.current) { arm.current.rotation.x = Math.sin(phase + i) * .7; arm.current.rotation.z = (i ? -1 : 1) * (1.8 + Math.sin(phase) * .4); } });
            legs.forEach((leg, i) => { if (leg.current) leg.current.rotation.x = Math.sin(phase) * (i ? -.3 : .3); });
            settled.current = false; invalidate(); return;
        }
        body.current.rotation.z = 0;
        arms.forEach(arm => { if (arm.current) arm.current.rotation.z = 0; });
        const now = sceneNow(snapshot, performance.now(), Date.now());
        const active = enabled && !document.hidden && now !== null && agent.activity !== 'disconnected';
        const trip = active && path && handoff ? sampleTrip(path, (now - Date.parse(handoff.at)) / 1000)
            : active && outing ? sampleTrip(pacing, (performance.now() - started.current) / 1000) : null;
        const walking = !!trip?.walking;
        const working = active && !walking && agent.activity === 'working';
        body.current.position.set(...(trip && !trip.done ? trip.position : home));
        body.current.position.y = walking ? Math.sin(state.clock.elapsedTime * 8) * .025 : working ? Math.sin(phase * .5) * .035 : 0;
        body.current.rotation.y = trip && !trip.done ? trip.heading : 0;
        body.current.rotation.z = working ? Math.sin(phase * .25) * .025 : 0;
        const swing = active && (walking || working) ? Math.sin(state.clock.elapsedTime * (walking ? 8 : 6)) * .3 : 0;
        arms.forEach((arm, i) => { if (arm.current) arm.current.rotation.x = i ? -swing : swing; });
        legs.forEach((leg, i) => { if (leg.current) leg.current.rotation.x = walking ? (i ? -1 : 1) * swing * 1.3 : 0; });
        // Demand rendering sleeps between walks. The final home frame is rendered once.
        if (active && (trip && !trip.done || agent.activity === 'working')) { settled.current = false; invalidate(); }
        else if (!settled.current) { settled.current = true; invalidate(); }
    });
    return home;
}
