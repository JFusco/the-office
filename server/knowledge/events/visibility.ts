import type { OfficeEvent } from '../../../src/shared';
import type { SourceRegistry } from '../sources/registry';
import { exposureSourceVisible } from '../sources/lesson-visibility';
export function eventVisible(registry:SourceRegistry,project:string,event:OfficeEvent):boolean {
    return (event.sourceBindings||[]).every(binding=>exposureSourceVisible(registry,project,binding));
}
