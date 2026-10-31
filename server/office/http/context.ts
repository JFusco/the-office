import { runtimeRevision } from '../revision';
import { ITSpecialist } from '../../it/it-specialist';
import { ServiceHealthChecks } from '../service-health';
import { createServer } from 'vite';
import { Offices } from '../../scheduling/offices';

export interface ServiceContext { offices: Offices; serviceHealth: ServiceHealthChecks; itSpecialist: ITSpecialist; loadedRevision: ReturnType<typeof runtimeRevision>; snapshot: (project?: string) => unknown; vite: Awaited<ReturnType<typeof createServer>> | null }
export type RequestContext = { project: string } & ReturnType<Offices['get']>;
