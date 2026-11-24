import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useIsPresent } from 'motion/react';
import { panelMotion } from '../tokens/motion';
import { IconButton, cx, interactive } from '../ui';
import { ChevronRight, X } from '../ui/icons';
import { ROLE_NAMES } from '../shared';
import type { InspectorProps } from './drawer/inspector-props';
import { DrawerNavigation, DrawerPage } from './drawer/DrawerTopic';
import { popPage, pushPage, type DrawerPath, type DrawerEntry } from './drawer/navigation';
import { InspectorContent } from './drawer/InspectorContent';
import { selectionTitle } from './drawer/selection-title';

export default function Inspector(props: InspectorProps) {
  const { selection, snapshot, names = ROLE_NAMES, reduced, onClose, drawerOpener, replacing, settingsReturn } = props;
  const close = useRef<HTMLButtonElement>(null),
    ownOpener = useRef<HTMLElement | null>(null),
    opener = drawerOpener || ownOpener;
  const present = useIsPresent();
  useEffect(() => {
    if (!present) {
      // Another drawer replaces this one after it closes; that drawer takes focus when it opens.
      if (replacing?.current) return;
      const active = document.activeElement,
        gear = settingsReturn?.current as HTMLButtonElement | null | undefined,
        target = opener.current;
      opener.current = null;
      if (selection.kind === 'settings') {
        // Settings returns to the gear from any entry path, unless the user already moved focus elsewhere.
        if (active && active !== document.body && !active.closest('[data-inspector]')) return;
        if (gear && !gear.disabled) {
          gear.focus({ preventScroll: true });
          return;
        }
      }
      if (target?.isConnected) target.focus({ preventScroll: true });
      return;
    }
    // Keep the original trigger across drawer swaps: a replacement opens with focus on the body.
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !active.closest('[data-inspector]'))
      opener.current = active;
    close.current?.focus({ preventScroll: true });
  }, [present]);
  const rootTitle = selectionTitle(selection, snapshot, names);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [path, setPath] = useState<DrawerPath>(() => ({
    entries: [{ id: 'root', title: rootTitle, trigger: null }],
    previous: null,
    returning: false,
  }));
  const [records, setRecords] = useState([{ id: 'root', selection, depth: 0, parentId: '' }]);
  const heading = useRef<HTMLHeadingElement>(null),
    restore = useRef<HTMLElement | null>(null);
  const current = path.entries.at(-1)!,
    parent = path.entries.at(-2);
  const title = current.id === 'root' ? rootTitle : current.title;
  const selectedPage=path.entries.map(entry=>records.find(record=>record.id===entry.id)?.selection).filter(Boolean).at(-1) || selection;
  const regionTitle=selectedPage.kind==='agent' ? snapshot.agents.find(agent=>agent.id===selectedPage.id)?.title : selectedPage.kind==='ticket'?'Ticket':selectionTitle(selectedPage,snapshot,names);
  const visibleRecord=records.find(record=>record.id===current.id)?.selection;
  const visibleTicket=present && visibleRecord?.kind==='ticket' ? visibleRecord.id : '';
  useLayoutEffect(()=>{
    props.onVisibleTicket?.(visibleTicket);
    return ()=>props.onVisibleTicket?.('');
  },[visibleTicket,props.onVisibleTicket]);
  function push(entry: DrawerEntry) {
    setPath((old) => pushPage(old, entry));
  }
  function open(next: InspectorProps['selection']) {
    const prior = records.find(
      (record) => record.parentId === current.id && JSON.stringify(record.selection) === JSON.stringify(next),
    );
    const id = prior?.id ?? crypto.randomUUID(),
      depth = path.entries.length;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRecords((old) =>
      old.some((record) => record.id === id) ? old : [...old, { id, selection: next, depth, parentId: current.id }],
    );
    if (next.kind === 'settings') props.onSettings?.();
    push({ id, title: selectionTitle(next, snapshot, names), trigger });
  }
  const remove = useCallback(
    (id: string) =>
      setPath((old) => {
        const index = old.entries.findIndex((entry) => entry.id === id);
        return index > 0 ? { entries: old.entries.slice(0, index), previous: id, returning: false } : old;
      }),
    [],
  );
  function back() {
    restore.current = current.trigger;
    setPath(popPage);
  }
  useLayoutEffect(() => {
    if (!path.previous) return;
    const target = path.returning && restore.current?.isConnected ? restore.current : heading.current;
    target?.focus({ preventScroll: true });
  }, [path]);
  function openProject(project: string, key: string) {
    const feature = key.startsWith('feature:') || key.startsWith('feature-goal:');
    if (project !== snapshot.project?.id || (feature && props.floor === 'cto'))
      return props.onOpenProject(project, key);
    if (key.startsWith('feature-goal:')) open({ kind: 'features', sourceGoalId: key.slice(13) });
    else if (key.startsWith('feature:')) open({ kind: 'features', id: key.slice(8) });
    else open({ kind: 'ticket', id: key });
  }
  return (
    <motion.aside
      data-inspector
      className={cx(
        'fixed top-topbar right-0 bottom-dock z-45 flex flex-col border-l border-drawer-line bg-drawer shadow-drawer backdrop-blur-drawer will-change-transform overscroll-contain max-compact:top-topbar-compact max-compact:bottom-dock-compact max-compact:w-full',
        selection.kind === 'features' || selection.kind === 'people' || selection.kind === 'telemetry'
          ? 'w-[min(1280px,100vw)]'
          : 'w-drawer wide:w-drawer-wide max-tablet:w-drawer-tablet max-compact:max-w-drawer',
        present ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-label={regionTitle || title}
      {...panelMotion(reduced)}
      inert={!present}
      aria-hidden={!present}
    >
      <div className="flex h-drawer-head shrink-0 items-center gap-control-gap border-b border-drawer-rule px-panel-padding max-compact:px-card-padding">
        {parent && (
          <button
            type="button"
            onClick={back}
            aria-label={`Back to ${parent.title}`}
            className={cx(
              'flex min-h-control-height min-w-0 max-w-1/2 items-center gap-1 rounded-4 text-12 text-link',
              interactive,
            )}
          >
            <ChevronRight size={16} className="shrink-0 rotate-180" />
            <span className="truncate">{parent.title}</span>
          </button>
        )}
        <h2 role={parent ? undefined : "presentation"} ref={heading} tabIndex={-1} className="min-w-0 flex-1 truncate text-13 font-semibold">
          {title}
        </h2>
        <IconButton ref={close} aria-label="Close details" onClick={onClose}>
          <X size={19} />
        </IconButton>
      </div>
      <div ref={setViewport} className="relative min-h-0 flex-1 overflow-hidden" />
      <DrawerNavigation.Provider value={{ path, viewport, reduced, push, back, remove }}>
        {records.map((record) => (
          <DrawerPage
            key={record.id}
            id={record.id}
            depth={record.depth}
            fill={record.selection.kind === 'chat' || record.selection.kind === 'cto-chat'}
          >
            <InspectorContent
              {...props}
              snapshot={(record.selection.kind==='ticket'||record.selection.kind==='pm-queue') ? (props.ticketSnapshot || snapshot) : snapshot}
                selection={record.selection}
              onOpenProject={openProject}
              onSelect={(next) => next && open(next)}
            />
          </DrawerPage>
        ))}
      </DrawerNavigation.Provider>
    </motion.aside>
  );
}
