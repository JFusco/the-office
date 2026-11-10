import type { Store } from '../store/store';
import type { SourceRegistry } from './sources/registry';
import type { BrainReader } from './brain/reader';
export interface KnowledgeContext { registry: SourceRegistry; stores: Map<string, Store>; brain: BrainReader; scan?: import('./sources/admission').SecretScanner }
