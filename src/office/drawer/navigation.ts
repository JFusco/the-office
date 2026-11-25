export interface DrawerEntry {
  id: string;
  title: string;
  trigger: HTMLElement | null;
}
export interface DrawerPath {
  entries: DrawerEntry[];
  previous: string | null;
  returning: boolean;
  returnFocus?: HTMLElement | null;
}
export function pushPage(path: DrawerPath, entry: DrawerEntry): DrawerPath {
  if (path.entries.some((page) => page.id === entry.id)) return path;
  return { entries: [...path.entries, entry], previous: path.entries.at(-1)!.id, returning: false };
}
export function popPage(path: DrawerPath, focus?: HTMLElement | null): DrawerPath {
  return removePage(path, path.entries.at(-1)!.id, focus);
}

export function removePage(path: DrawerPath, id: string, focus?: HTMLElement | null): DrawerPath {
  const index = path.entries.findIndex(entry => entry.id === id);
  if (index <= 0) return path;
  return {
    entries: path.entries.slice(0, index),
    previous: path.entries.at(-1)!.id,
    returning: true,
    returnFocus: focus || path.entries[index].trigger,
  };
}


export function renamePage(path: DrawerPath, id: string, title: string): DrawerPath {
  const page = path.entries.find(entry => entry.id === id);
  if (!page || page.title === title) return path;
  return { ...path, entries: path.entries.map(entry => entry === page ? { ...entry, title } : entry) };
}
