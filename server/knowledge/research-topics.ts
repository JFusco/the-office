import { RESEARCH_CODEX_VERSION } from '../workers/research-profile';
import type { ResearchTopic } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';
import { learningDigest } from './learning-events';
/** Fixed public vocabulary: private incident text is used only for local classification. */
const TEMPLATES = [
    { match: /timeout|subprocess|process group/i, version: process.versions.node, technology: 'Node.js', question: 'What do official Node.js documents recommend for subprocess cancellation and process cleanup?' },
    { match: /sqlite|database.*lock|busy_snapshot/i, version: process.versions.sqlite || 'unknown', technology: 'SQLite', question: 'What do official SQLite documents recommend for transaction contention and busy handling?' },
    { match: /uncertain|read.?back|duplicate.*(issue|write)/i, version: '2022-11-28', technology: 'GitHub REST API', question: 'What do official GitHub REST API documents recommend for reconciling uncertain issue creation and avoiding duplicate writes?' },
    { match: /review|context.*limit|output.*limit/i, version: RESEARCH_CODEX_VERSION, technology: 'Codex', question: 'What do official Codex documents recommend for bounded context and durable independent review handoffs?' },
];
export function publicTopicSafe(topic: ResearchTopic, privateTerms: string[]): boolean {
    const text = JSON.stringify(topic).toLowerCase();
    return TEMPLATES.some(template => template.question === topic.question && template.technology === topic.technology && template.version === topic.version) &&
        topic.version !== 'unknown' && !privateTerms.filter(value => value.length > 2).some(value => text.includes(value.toLowerCase()));
}
export function researchTopics(stores: Store[]): ResearchTopic[] {
    const terms = stores.flatMap(store => [store.project.id, store.project.repository, store.project.repo, ...store.state.tickets.map(ticket => ticket.key)]).filter(Boolean);
    const problems = stores.flatMap(store => (store.state.knowledge?.followups || []).filter(item => ['unresolved', 'needs-input'].includes(item.disposition) && item.history.length > 1 && !store.state.knowledge?.improvements?.some(fix => fix.providerId === item.key)));
    problems.sort((a, b) => b.history.length - a.history.length || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
    const topics: ResearchTopic[] = [];
    for (const problem of problems) {
        const template = TEMPLATES.find(template => template.match.test(problem.nextAction));
        if (!template) continue;
        const topic = { id: learningDigest(template.question), question: template.question, technology: template.technology, version: template.version };
        if (publicTopicSafe(topic, terms) && !topics.some(item => item.id === topic.id)) topics.push(topic);
        if (topics.length === 3) break;
    }
    return topics;
}
