import { SnapshotAcceptance } from './snapshot-order';
import { useCallback, useEffect, useState, useRef } from 'react';
import type { OfficeSnapshot, Role, Stage } from '../shared';
import { officeUrl, ROLE_NAMES, STAGE_LABELS, STAGE_ROLE } from '../shared';
export function useOffice() {
    const [project, setProject] = useState(() => localStorage.getItem('office.project') || 'cec'), [switching, setSwitching] = useState(false);
    const [projects, setProjects] = useState<{
        id: string;
        name: string;
    }[]>([{ id: 'cec', name: 'CEC' }, { id: 'cms-field-vocabulary', name: 'CMS field vocabulary' }]);
    const accepted = useRef(new SnapshotAcceptance()), receivedAt = useRef(0), visible = useRef(true);
    const current = useRef(project), generation = useRef(0);
    current.current = project;
    const selectProject = useCallback((id: string) => {
        if (current.current === id)
            return;
        generation.current++;
        accepted.current = new SnapshotAcceptance();
        current.current = id;
        localStorage.setItem('office.project', id);
        setConnected(false);
        setSwitching(true);
        setProject(id);
    }, []);
    useEffect(() => {
        let mounted = true;
        void fetch('/api/projects').then(r => r.json()).then(data => {
            if (!mounted || !Array.isArray(data.projects))
                return;
            setProjects(data.projects);
            if (!data.projects.some((p: {
                id: string;
            }) => p.id === current.current))
                selectProject(data.projects[0]?.id || 'cec');
        }).catch(() => { });
        return () => { mounted = false; };
    }, [selectProject]);
    const [snapshot, setSnapshot] = useState<OfficeSnapshot | null>(null), [connected, setConnected] = useState(false), [error, setError] = useState('');
    useEffect(() => {
        if (!snapshot)
            return;
        const timer = setTimeout(() => setConnected(false), Math.max(0, 35001 - (performance.now() - receivedAt.current)));
        return () => clearTimeout(timer);
    }, [snapshot]);
    const acceptSnapshot = useCallback((data: OfficeSnapshot, synchronized = false) => {
        if (!accepted.current.accept(data, synchronized))
            return false;
        receivedAt.current = performance.now();
        setSnapshot(data);
        setSwitching(false);
        setConnected(navigator.onLine);
        setError('');
        return true;
    }, []);
    const refresh = useCallback(async () => {
        const epoch = generation.current;
        try {
            const r = await fetch(officeUrl('/api/office', project));
            if (!r.ok)
                throw new Error(`Office returned ${r.status}`);
            const data = await r.json();
            if (current.current !== project || generation.current !== epoch)
                return;
            acceptSnapshot(data, true);
        }
        catch (e) {
            if (current.current === project && generation.current === epoch) {
                setError(String(e));
                setConnected(false);
            }
        }
    }, [project, acceptSnapshot]);
    useEffect(() => {
        let stream: EventSource | undefined;
        let retry: ReturnType<typeof setTimeout> | undefined;
        let mounted = true;
        const invalidate = () => {
            generation.current++;
            stream?.close();
            stream = undefined;
            clearTimeout(retry);
            setConnected(false);
        };
        const connect = () => {
            if (!mounted || current.current !== project)
                return;
            invalidate();
            visible.current = !document.hidden;
            if (!navigator.onLine || !visible.current)
                return;
            const epoch = generation.current;
            const connection = new EventSource(officeUrl('/api/events', project));
            stream = connection;
            const active = () => mounted && stream === connection && current.current === project && generation.current === epoch;
            connection.addEventListener('snapshot', event => {
                if (!active())
                    return;
                try {
                    const data = JSON.parse((event as MessageEvent).data);
                    if (!acceptSnapshot(data) && data.serviceInstanceId !== accepted.current.instance)
                        void refresh();
                }
                catch {
                    setError('Office sent an unreadable snapshot');
                }
            });
            // Closing the old connection also invalidates its pending HTTP responses.
            connection.onerror = () => {
                if (!active())
                    return;
                invalidate();
                retry = setTimeout(connect, 2000);
            };
            // Opening a stream alone cannot restore timer freshness.
            void refresh();
        };
        const offline = () => invalidate();
        const visibility = () => {
            visible.current = !document.hidden;
            if (visible.current)
                connect();
            else
                invalidate();
        };
        document.addEventListener('visibilitychange', visibility);
        window.addEventListener('pageshow', connect);
        window.addEventListener('focus', connect);
        window.addEventListener('office-clock-gap', connect);
        window.addEventListener('offline', offline);
        window.addEventListener('online', connect);
        connect();
        return () => {
            mounted = false;
            invalidate();
            document.removeEventListener('visibilitychange', visibility);
            window.removeEventListener('pageshow', connect);
            window.removeEventListener('focus', connect);
            window.removeEventListener('office-clock-gap', connect);
            window.removeEventListener('offline', offline);
            window.removeEventListener('online', connect);
        };
    }, [refresh, project, acceptSnapshot]);
    const command = useCallback(async (action: string, key?: string) => {
        if (switching || current.current !== project || snapshot?.project?.id !== project)
            throw new Error('Wait for the selected project to load');
        const r = await fetch(officeUrl('/api/commands', project), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, key }) });
        const data = await r.json();
        if (!r.ok)
            throw new Error(data.error || 'Office action failed');
        await refresh();
    }, [refresh, project, switching, snapshot?.project?.id]);
    const sendMessage = useCallback(async (body: {
        id: string;
        role: Role;
        ticket: string;
        actionId: string;
        body: string;
        recheck: boolean;
    }) => {
        if (switching || current.current !== project || snapshot?.project?.id !== project)
            throw new Error('Wait for the selected project to load');
        const r = await fetch(officeUrl('/api/messages', project), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const result = await r.json();
        if (!r.ok)
            throw new Error(result.error || 'Message could not be delivered');
        await refresh();
        return result;
    }, [refresh, project, switching, snapshot?.project?.id]);
    return { snapshot: snapshot ? { ...snapshot, liveAnchor: { receivedAt: receivedAt.current, serverTime: snapshot.serverTime, connected, visible: visible.current, connectionEpoch: generation.current }, timerStatus: connected ? 'live' as const : 'last-confirmed' as const } : null, connected, error, command, refresh, sendMessage, project, selectProject, switching, projects };
}
const tourStages: Stage[] = ['mailbox', 'understand', 'plan', 'plan-review', 'implement', 'code-review', 'draft-pr', 'qa', 'repair', 'retest', 'publish', 'ci', 'ready-for-staging'];
export function demoSnapshot(live: OfficeSnapshot | null, step: number): OfficeSnapshot {
    const stage = tourStages[step % tourStages.length], role = STAGE_ROLE[stage], now = new Date().toISOString();
    const previous = STAGE_ROLE[tourStages[(step + tourStages.length - 1) % tourStages.length]];
    return { revision: step, serverTime: now, startedAt: now, paused: false, pilotKey: '', mode: 'demo',
        intake: { status: 'idle', lastChecked: now, error: '', schedule: 'Illustrative tour · no external actions' },
        agents: (['pm', 'developer', 'lead', 'qa'] as Role[]).map(id => ({ id, name: ROLE_NAMES[id], title: { pm: 'Project manager', developer: 'Developer', lead: 'Lead developer', qa: 'QA engineer', cto: 'Technology & priorities', it: 'IT specialist' }[id], activity: id === role ? 'working' : 'idle', task: id === role ? STAGE_LABELS[stage] : 'Ready for a handoff', ticket: id === role ? 'DEMO-01' : '', sessionId: '', lastSeen: now })),
        tickets: [{ key: 'DEMO-01', summary: 'Make the save confirmation accessible', type: 'Bug', status: 'Demonstration', statusId: '', assignee: '', subtask: false, boardMember: false, url: '', updated: now, stage, activity: 'working', blocker: '', runId: '', attempt: stage === 'repair' ? 1 : 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: now }],
        azure: { status: 'idle', observedAt: '', error: '', builds: [], prs: [], deployed: [] }, outbox: [], messages: [], projectNotes: [], events: [{ id: step, at: now, kind: 'tour', role, ticket: 'DEMO-01', message: `Office tour: ${STAGE_LABELS[stage]}` }],
        lastHandoff: role !== previous ? { at: now, from: previous, to: role, ticket: 'DEMO-01' } : null };
}
