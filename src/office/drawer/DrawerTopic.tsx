import { createContext, useContext, useLayoutEffect, useRef, useId, useState, type FocusEvent, type Ref, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ChevronRight } from '../../ui/icons';
import { interactive } from '../../ui';
import { drawerPageMotion } from '../../tokens/motion';
import type { createConversationDrafts } from '../../conversations/Conversation';
import type { DrawerEntry, DrawerPath } from './navigation';

export const DrawerNavigation = createContext<{
  drafts: ReturnType<typeof createConversationDrafts>;
  path: DrawerPath;
  viewport: HTMLDivElement | null;
  reduced: boolean;
  back: (focus?: HTMLElement | null) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  push: (entry: DrawerEntry) => void;
} | null>(null);

export function useDrawerReturnRow<T>() {
  const [opened, setOpened] = useState<{ value: T; source: HTMLElement }>();
  const press = useRef<{ down: boolean; after?: () => void }>({ down: false });
  useLayoutEffect(() => {
    if (!opened) return;
    const doc = opened.source.ownerDocument;
    const events = new AbortController();
    const options = { capture: true, signal: events.signal };
    const held = press.current;
    let timer: ReturnType<typeof setTimeout>;
    function finish() {
      held.down = false;
      if (held.after) timer = setTimeout(() => {
        const update = held.after;
        held.after = undefined;
        update?.();
      }, 0);
    }
    doc.addEventListener('pointerdown', () => { held.down = true; }, options);
    doc.addEventListener('pointerup', finish, options);
    doc.addEventListener('pointercancel', finish, options);
    doc.defaultView?.addEventListener('blur', finish, { signal: events.signal });
    return () => {
      events.abort();
      clearTimeout(timer);
      held.down = false;
      held.after = undefined;
    };
  }, [opened?.source]);
  function updateRow(update: () => void) {
    // Moving a row between pointerdown and click changes the browser's click target.
    if (press.current.down) press.current.after = update;
    else {
      press.current.after = undefined;
      update();
    }
  }
  function remember(value: T, source: HTMLElement) {
    updateRow(() => setOpened({ value, source }));
  }
  function release({ currentTarget, relatedTarget }: FocusEvent<HTMLElement>) {
    // Blur during a push comes from the page becoming inert. Keep its Back target.
    if (currentTarget.closest('[data-inspector-scroll]') && !currentTarget.contains(relatedTarget)) {
      updateRow(() => setOpened(old => old && currentTarget.contains(old.source) ? undefined : old));
    }
  }
  return { opened: opened?.value, remember, release, clear: () => setOpened(undefined) };
}

export function DrawerPage({
  id,
  depth,
  children,
  fill = false,
}: {
  id: string;
  depth: number;
  children: ReactNode;
  fill?: boolean;
}) {
  const nav = useContext(DrawerNavigation)!;
  const current = nav.path.entries.at(-1)!.id === id;
  const behind = nav.path.entries.some((entry) => entry.id === id);
  const visible = current || (!nav.reduced && nav.path.previous === id);
  const scroll = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (current && !nav.path.returning && scroll.current) scroll.current.scrollTop = 0;
  }, [current, nav.path.returning]);
  if (!nav.viewport) return null;
  return createPortal(
    <motion.div
      ref={scroll}
      data-drawer-page={id}
      data-inspector-scroll={current || undefined}
      initial={depth && !nav.reduced ? { x: '100%' } : false}
      animate={{ x: current || nav.reduced ? '0%' : behind ? '-20%' : '100%' }}
      transition={drawerPageMotion(nav.reduced)}
      inert={!current}
      aria-hidden={!current}
      className={
        'absolute inset-0 [&>section:first-child]:mt-0 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-paper p-panel-padding wrap-anywhere scrollbar-thin scrollbar-thumb-scrollbar max-compact:p-card-padding' +
        (fill ? ' flex flex-col' : '') +
        (visible ? ' visible' : ' invisible') +
        ((current && !nav.path.returning) || (!current && nav.path.returning && visible) ? ' z-10' : ' z-0')
      }
    >
      {children}
    </motion.div>,
    nav.viewport,
  );
}

export function DrawerRow({title, detail, onOpen, onBlur, disabled, ref}: {
  title: string;
  detail?: ReactNode;
  onOpen: (source: HTMLElement) => void;
  onBlur?: (event: FocusEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      data-drawer-row
      type="button"
      className={`flex min-h-11 w-full items-center gap-control-gap border-b border-row-rule bg-field px-card-padding py-2.5 text-left text-13 font-medium enabled:hover:bg-icon-hover ${interactive}`}
      disabled={disabled}
      onClick={event => onOpen(event.currentTarget)}
      onBlur={onBlur}
    >
      <span className="min-w-0 flex-1">{title}</span>
      {detail != null && <span className="max-w-1/2 text-right text-12 font-normal text-muted">{detail}</span>}
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </button>
  );
}

export function DrawerTopic({
  title,
  detail,
  children,
  onOpen,
  trigger,
  initial,
  available = true,
}: {
  available?: boolean;
  initial?: boolean;
  title: string;
  detail?: ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  trigger?: (open: (source: HTMLElement) => void) => ReactNode;
}) {
  const nav = useContext(DrawerNavigation),
    id = useId();
  const [depth, setDepth] = useState(0);
  const row = useRef<HTMLButtonElement>(null),
    entered = useRef(false);
  useLayoutEffect(() => {
    if (initial && !entered.current && nav && row.current?.closest('[data-inspector-scroll]')) {
      entered.current = true;
      onOpen?.();
      setDepth(nav.path.entries.length);
      nav.push({ id, title, trigger: row.current });
    }
  }, [initial, nav, id, title, onOpen]);
  const rename = nav?.rename;
  useLayoutEffect(() => { rename?.(id, title); }, [id, title, rename]);
  const remove = nav?.remove;
  useLayoutEffect(() => () => { entered.current = false; remove?.(id); }, [id, remove]);
  // Shared domain views also render in the stand-alone Brain workspace.
  if (!available && !depth) return null;
  if (!nav) return <>{children}</>;
  function open(source: HTMLElement) {
    onOpen?.();
    setDepth(nav!.path.entries.length);
    nav!.push({ id, title, trigger: source });
  }
  return (
    <>
      {trigger ? (
        trigger(open)
      ) : (
        <DrawerRow ref={row} title={title} detail={detail} onOpen={open}/>
      )}
      {depth > 0 && (
        <DrawerPage id={id} depth={depth}>
          {children}
        </DrawerPage>
      )}
    </>
  );
}
