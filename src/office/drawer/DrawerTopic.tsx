import { createContext, useContext, useLayoutEffect, useRef, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ChevronRight } from '../../ui/icons';
import { interactive } from '../../ui';
import { drawerPageMotion } from '../../tokens/motion';
import type { DrawerEntry, DrawerPath } from './navigation';

export const DrawerNavigation = createContext<{
  path: DrawerPath;
  viewport: HTMLDivElement | null;
  reduced: boolean;
  back: () => void;
  remove: (id: string) => void;
  push: (entry: DrawerEntry) => void;
} | null>(null);

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
      animate={{ x: current ? '0%' : behind ? '-20%' : '100%' }}
      transition={drawerPageMotion(nav.reduced)}
      inert={!current}
      aria-hidden={!current}
      style={{ zIndex: depth, visibility: visible ? 'visible' : 'hidden' }}
      className={
        'absolute inset-0 [&>section:first-child]:mt-0 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-paper p-panel-padding wrap-anywhere scrollbar-thin scrollbar-thumb-scrollbar max-compact:p-card-padding' +
        (fill ? ' flex flex-col' : '')
      }
    >
      {children}
    </motion.div>,
    nav.viewport,
  );
}

export function DrawerTopic({
  title,
  detail,
  children,
  onOpen,
  trigger,
  initial,
}: {
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
    if (initial && !entered.current && nav && row.current) {
      entered.current = true;
      setDepth(nav.path.entries.length);
      nav.push({ id, title, trigger: row.current });
    }
  }, [initial, nav, id, title]);
  const remove = nav?.remove;
  useLayoutEffect(() => () => remove?.(id), [id, remove]);
  // Shared domain views also render in the stand-alone Brain workspace.
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
        <button
          ref={row}
          type="button"
          className={`flex min-h-control-height w-full items-center gap-control-gap border-b border-row-rule py-3 text-left text-13 font-medium hover:bg-icon-hover ${interactive}`}
          onClick={(event) => open(event.currentTarget)}
        >
          <span className="min-w-0 flex-1">{title}</span>
          {detail != null && <span className="text-right text-11 font-regular text-muted">{detail}</span>}
          <ChevronRight size={16} className="shrink-0 text-muted" />
        </button>
      )}
      {depth > 0 && (
        <DrawerPage id={id} depth={depth}>
          {children}
        </DrawerPage>
      )}
    </>
  );
}
