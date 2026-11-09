export { lessonPurpose, MAX_LESSONS, SECTION_LIMIT, LESSON_LIMIT, URL_LIMIT } from './lesson-selection';
import { selectLessons } from './lesson-selection';
import type { Store } from '../store/store';
/** Compatibility wrapper; dispatchers retain the full selection manifest. */
export function knowledgeContext(store: Pick<Store, 'project' | 'state'>, stage?: string): string {
    return selectLessons(store, { stage }).text;
}
