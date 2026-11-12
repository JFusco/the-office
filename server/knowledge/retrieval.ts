import type { KnowledgeContext } from './context';
import type { KnowledgeHit, KnowledgeSearch } from '../../src/contracts/knowledge-retrieval';
import { lessonForProject } from './lesson-for-project';
import { digest } from './digest';
import { guidanceExcerpt } from './content/guidance-excerpt';
import { lessonText } from './lesson-selection';
const words = (text: string) => [...new Set(text.toLowerCase().match(/[\p{L}\p{N}_-]{2,}/gu) || [])];
export function officeSearch(context: KnowledgeContext, project: string, query: string, limit = 10): KnowledgeHit[] {
    const store = context.stores.get(project); if (!store) throw Error('Unknown knowledge project');
    const records: KnowledgeHit[] = [];
    for (const lesson of [...(store.state.knowledge?.lessons || []), ...(store.state.knowledge?.officeLessons || [])]) {
        if (lesson.status !== 'active' || lesson.tier === 'hypothesis') continue;
        const permitted = lessonForProject(project, lesson), text = `${lessonText(lesson)}\n${lesson.detail}`;
        records.push({ reference: { id: `lesson:${lesson.scope}:${lesson.id}`, kind: 'lesson', lesson:{scope:lesson.scope,id:lesson.id,revision:lesson.revision}, version: String(lesson.revision), contentSha256: digest(text) }, title: lesson.statement,
            excerpt: text, citation: permitted.evidence[0]?.url || '', scope: lesson.scope, limitations: ['Advisory guidance; verify against current evidence'] });
    }
    const terms = words(query);
    return records.map(hit => ({ hit, score: terms.reduce((n, word) => n + (hit.title.toLowerCase().includes(word) ? 4 : 0) + (hit.excerpt.toLowerCase().includes(word) ? 1 : 0), 0) }))
        .filter(r => !terms.length || r.score > 0).sort((a, b) => b.score - a.score || a.hit.reference.id.localeCompare(b.hit.reference.id)).slice(0, limit)
        .map(({ hit }) => ({ ...hit, excerpt: hit.excerpt.slice(0, 1000) }));
}
export async function retrieve(context: KnowledgeContext, project: string, query: string, options:{snapshot?:string;technicalOnly?:boolean}={}): Promise<KnowledgeSearch> {
    if (query.length > 2000) throw Error('Knowledge query exceeds 2000 characters');
    let snapshot = options.snapshot || null, technical: KnowledgeHit[] = [], technicalStatus: KnowledgeSearch['technicalStatus'] = 'unavailable';
    try {
        snapshot ||= await context.brain.snapshot();
        const notes = await context.brain.search(snapshot, query.trim() || 'project guidance', 5);
        for (const note of notes) {
            const body = await context.brain.read(snapshot, note.path);
            if (body.contentSha256 !== note.contentSha256) throw Error('Brain search/read content mismatch');
            const excerpt = guidanceExcerpt(body.text);
            if (!excerpt) continue;
            technical.push({ reference: { id: `brain:${snapshot}:${note.path}`, kind: 'brain', path: note.path, snapshot, contentSha256: body.contentSha256 }, title: note.title,
                excerpt, citation: note.path, scope: 'technical', limitations: note.limitations || [] });
        }
        technicalStatus = 'available';
    } catch { technical = []; }
    // Office results are selected after every asynchronous Brain read, from current lessons.
    const office = options.technicalOnly ? [] : officeSearch(context, project, query);
    const result: KnowledgeSearch = { office, technical, snapshot, technicalStatus, truncated: false };
    while (Buffer.byteLength(JSON.stringify(result)) > 32768) { result.truncated = true; if (technical.length) technical.pop(); else if (office.length) office.pop(); else break; }
    return result;
}
