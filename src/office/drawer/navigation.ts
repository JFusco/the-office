export interface DrawerEntry {
  id: string;
  title: string;
  trigger: HTMLElement | null;
}
export interface DrawerPath {
  entries: DrawerEntry[];
  previous: string | null;
  returning: boolean;
}
export function pushPage(path: DrawerPath, entry: DrawerEntry): DrawerPath {
  if (path.entries.some((page) => page.id === entry.id)) return path;
  return { entries: [...path.entries, entry], previous: path.entries.at(-1)!.id, returning: false };
}
export function popPage(path: DrawerPath): DrawerPath {
  if (path.entries.length === 1) return path;
  return { entries: path.entries.slice(0, -1), previous: path.entries.at(-1)!.id, returning: true };
}
