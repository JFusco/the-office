import { runtimeRevision } from '../revision';
import { ITSpecialist } from '../../it/it-specialist';
import { ServiceHealthChecks } from '../service-health';
import { createServer } from 'vite';
import { Offices } from '../../scheduling/offices';
import type { OfficeConfigInputs } from './office-config';
import type { LoopDelay } from '../loop-delay';

export interface ServiceContext { offices: Offices; serviceHealth: ServiceHealthChecks; itSpecialist: ITSpecialist; loadedRevision: ReturnType<typeof runtimeRevision>; /** A project's snapshot as redacted text; routes never receive the unredacted object. */ snapshotText: (project: string, purpose: 'a request' | 'a push') => string; vite: Awaited<ReturnType<typeof createServer>> | null; config: OfficeConfigInputs; loopDelay?: LoopDelay }
export type RequestContext = { project: string } & ReturnType<Offices['get']>;
