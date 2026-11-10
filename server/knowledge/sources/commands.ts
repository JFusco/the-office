import { z } from 'zod';
import type { SourceRegistry } from './registry';
import { SourceInput } from './source-record';

const Command = z.discriminatedUnion('operation', [
    z.object({ operation: z.literal('add'), source: SourceInput }).strict(),
    z.object({ operation: z.literal('share'), id: z.string().uuid(), projectId: z.string(), revision: z.number().int().positive() }).strict(),
    z.object({ operation: z.literal('unsubscribe'), id: z.string().uuid(), projectId: z.string(), revision: z.number().int().positive() }).strict(),
    z.object({ operation: z.enum(['pause', 'resume', 'remove', 'withdraw', 'refresh']), id: z.string().uuid(), revision: z.number().int().positive() }).strict(),
    z.object({ operation: z.literal('cadence'), id: z.string().uuid(), cadence: z.enum(['daily', 'weekly', 'manual']), revision: z.number().int().positive() }).strict(),
]);
export function sourceCommand(registry: SourceRegistry, projectIds: string[], actingProject: string, input: unknown): { id: string } {
    const command = Command.parse(input);
    if (!projectIds.includes(actingProject)) throw Error('Unknown project');
    if (command.operation === 'add') {
        if (command.source.homeProjectId !== actingProject || !projectIds.includes(command.source.homeProjectId)) throw Error('Select the source home project before adding');
        return { id: registry.create(command.source).id };
    }
    const source = registry.get(command.id);
    if (!source || source.revision !== command.revision) throw Error('Source changed; reload before editing');
    const selfUnsubscribe = command.operation === 'unsubscribe' && command.projectId === actingProject && registry.authorized(source.id, actingProject);
    if (source.homeProjectId !== actingProject && !selfUnsubscribe) throw Error('Only the home project manages this source');
    if (command.operation === 'share' || command.operation === 'unsubscribe') {
        if (!projectIds.includes(command.projectId)) throw Error('Unknown subscriber project');
        registry.transaction(() => {
            registry.subscribe(source.id, command.projectId, command.operation === 'share');
        });
        return { id: source.id };
    }
    registry.update(source.id, source.revision, current => {
        if (command.operation === 'cadence') current.cadence = command.cadence;
        else if (command.operation === 'refresh') {
            if (current.state !== 'active') throw Error('Resume the source before requesting refresh');
            // Coalesced until the scheduler records consumption. No independent collection entry point.
            current.refreshRequestedAt ??= registry.clock.now().toISOString();
        } else {
            if (current.state === 'withdrawn' && command.operation !== 'withdraw') throw Error('Withdrawal is final in this version; this source cannot resume or be registered again');
            current.state = ({ pause: 'paused', resume: 'active', remove: 'removed', withdraw: 'withdrawn' } as const)[command.operation];
        }
    });
    return { id: source.id };
}
