export interface KnowledgeReference {
    id: string; kind: 'source' | 'lesson' | 'brain'; sourceId?: string; unitId?: string; version?: string;
    snapshot?: string; path?: string; contentSha256: string;
    lesson?: import('./knowledge').LessonReference;
    sourceBindings?: import('./knowledge').KnowledgeSourceBinding[];
}
export interface KnowledgeHit { reference: KnowledgeReference; title: string; excerpt: string; citation: string; scope: 'project' | 'office' | 'technical'; limitations: string[] }
export interface KnowledgeSearch { office: KnowledgeHit[]; technical: KnowledgeHit[]; snapshot: string | null; technicalStatus: 'available' | 'unavailable'; truncated: boolean }
