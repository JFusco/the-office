import { Section, SectionTitle, Tag, TextLink, mutedCopy, summary } from '../ui';
import type { ServiceHealth } from '../shared';

const labels = { connected: 'Connected', warning: 'Check needs follow-up', disconnected: 'Login unavailable', unknown: 'Not verified' };
export function ServiceHealthRow({ service }: { service: ServiceHealth }) {
    return <Section>
        <SectionTitle className="mb-4 flex-wrap justify-between">{service.name}<Tag tone={service.status === 'connected' ? 'passed' : service.status === 'unknown' ? 'waiting' : 'blocked'}>{service.statusLabel || labels[service.status]}</Tag></SectionTitle>
        {service.identity ? <p className="text-12 leading-body">{service.identity}</p> : null}
        <p className="text-12 leading-body">{service.detail}</p>
        <small className="mt-2 block text-11 leading-relaxed text-muted">{service.checkedLabel || 'Check completed'}: {service.checkedAt ? new Date(service.checkedAt).toLocaleString() : 'Not recorded'}</small>
        {service.lastSuccessAt && service.lastSuccessAt !== service.checkedAt && service.status !== 'connected' ? <small className="mt-2 block text-11 text-muted">Last successful status read: {new Date(service.lastSuccessAt).toLocaleString()}</small> : null}
        {service.sourceUrl ? <p className="mt-2 text-12"><TextLink href={service.sourceUrl} target="_blank" rel="noreferrer">View provider status ↗</TextLink></p> : null}
        {service.status !== 'connected' && service.nextStep ? <p className="mt-2.5 rounded-7 bg-health-next p-2.5 text-11 leading-body text-health-next-ink">Next: {service.nextStep}</p> : null}
        {service.lastFailure ? <details className="mt-2 text-12"><summary className={summary}>Earlier delivery failure · {new Date(service.lastFailure.at).toLocaleTimeString()}</summary><p className={mutedCopy}>{service.lastFailure.detail} This delivery history does not determine the current login status.</p></details> : null}
    </Section>;
}
