export function draftKey(project: string, feature: string, round: string, question: string) {
    return ['office.feature.answer', project, feature, round, question].map(encodeURIComponent).join(':');
}
export function readDraft(key: string, storage: Pick<Storage, 'getItem'> = localStorage) { try { return storage.getItem(key) || ''; } catch { return ''; } }
export function saveDraft(key: string, text: string, storage: Pick<Storage, 'setItem'> = localStorage) { storage.setItem(key, text); }
