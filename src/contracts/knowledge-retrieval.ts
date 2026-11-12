export interface KnowledgeReference {
    id: string; kind: 'lesson' | 'brain'; version?: string;
    snapshot?: string; path?: string; contentSha256: string;
    lesson?: import('./knowledge').LessonReference;
}
export interface KnowledgeHit { reference: KnowledgeReference; title: string; excerpt: string; citation: string; scope: 'project' | 'office' | 'technical'; limitations: string[] }
export interface KnowledgeSearch { office: KnowledgeHit[]; technical: KnowledgeHit[]; snapshot: string | null; technicalStatus: 'available' | 'unavailable'; truncated: boolean }
