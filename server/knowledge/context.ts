import type { Store } from '../store/store';
import type { BrainReader } from './brain/reader';
export interface KnowledgeContext { stores: Map<string, Store>; brain: BrainReader }
