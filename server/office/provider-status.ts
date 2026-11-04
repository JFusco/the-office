import { z } from 'zod';
import { command } from '../workers/process';
import type { ServiceHealth } from '../../src/shared';

const summary = z.object({
    status: z.object({ indicator: z.enum(['none', 'minor', 'major', 'critical', 'maintenance']), description: z.string().min(1) }),
    components: z.array(z.object({ name: z.string(), status: z.string() })),
    incidents: z.array(z.object({ name: z.string(), status: z.string() })).optional(),
});
const providers = [
    { id: 'provider:openai', name: 'OpenAI · public service status', url: 'https://status.openai.com/' },
    { id: 'provider:anthropic', name: 'Claude · public service status', url: 'https://status.claude.com/' },
];

/** Public availability is independent of local login and never gates dispatch. */
export class ProviderStatusChecks {
    private cached?: { at: number; services: ServiceHealth[] };
    private pending?: Promise<ServiceHealth[]>;
    private successes = new Map<string, string>();
    constructor(private execute: typeof command = command, private now = Date.now) { }
    async report(): Promise<ServiceHealth[]> {
        if (this.cached && this.now() - this.cached.at < 60000) return this.cached.services;
        if (this.pending) return this.pending;
        this.pending = Promise.all(providers.map(async provider => {
            const base = { id: provider.id, name: provider.name, kind: 'provider' as const, sourceUrl: provider.url, checkedLabel: 'Status page checked' };
            let result: Pick<ServiceHealth, 'status' | 'statusLabel' | 'detail'>;
            try {
                if (process.env.VITEST && this.execute === command) throw new Error('Inject the public status reader in tests');
                const raw = await this.execute('curl', ['--fail', '--silent', '--show-error', '--max-time', '10', `${provider.url}api/v2/summary.json`], { timeout: 15000, readOnly: true });
                const data = summary.parse(JSON.parse(raw));
                const affected = data.components.filter(c => c.status !== 'operational');
                const incidents = (data.incidents || []).filter(i => !['resolved', 'postmortem'].includes(i.status));
                const healthy = data.status.indicator === 'none' && !affected.length && !incidents.length;
                result = { status: healthy ? 'connected' : 'warning', statusLabel: healthy ? 'Operational' : 'Service disruption', detail: [data.status.description, ...affected.slice(0, 5).map(c => `${c.name}: ${c.status.replaceAll('_', ' ')}`), ...incidents.slice(0, 3).map(i => i.name)].join('. ') + '. Public provider status does not verify your account.' };
                this.successes.set(provider.id, new Date(this.now()).toISOString());
            } catch {
                result = { status: 'unknown', statusLabel: 'Status unavailable', detail: 'The public status page could not be checked. This does not establish an outage or a login failure. The Office will check again automatically.' };
            }
            const at = this.now();
            return { ...base, ...result, checkedAt: new Date(at).toISOString(), lastSuccessAt: this.successes.get(provider.id), expiresAt: new Date(at + 150000).toISOString() };
        })).then(services => { this.cached = { at: this.now(), services }; return services; }).finally(() => { this.pending = undefined; });
        return this.pending;
    }
}
