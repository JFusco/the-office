import { Button, Select, Notice, Tag, cx, field, fieldLabel, selectField, checkbox, summary, mutedCopy } from '../../ui';
import { useState } from 'react';
export interface SourceConnection { id: string; workspace: string; appId: string; tools: Record<string, string>; publicHosts: string[] }
export function AddSourceForm({ project, connections, pending, onSubmit, onClose }: { project: string; connections: SourceConnection[]; pending: boolean; onSubmit: (source: unknown) => Promise<void>; onClose: () => void }) {
    const [connection, setConnection] = useState(connections[0]?.id || ''), [channel, setChannel] = useState(''), [name, setName] = useState('');
    const [destination, setDestination] = useState('project-evidence'), [domains, setDomains] = useState('tooling');
    const selected = connections.find(c => c.id === connection);
    return <form className="rounded-7 border border-field-line bg-paper p-5 mb-6" aria-label="Add a Slack channel" onSubmit={e => { e.preventDefault(); if (!selected) return; const { workspace, appId, tools, publicHosts } = selected;
        void onSubmit({ operation: 'add', source: { kind: 'slack', title: `#${name}`, homeProjectId: project, destination, cadence: destination === 'technical-brain' ? 'weekly' : 'daily',
            authority: { workspace, appId, tools, publicHosts, channels: [{ id: channel.trim(), name: name.trim() }] }, ...(destination === 'technical-brain' ? { domains: domains.split(',').map(s => s.trim()).filter(Boolean) } : {}) } }); }}>
        <div className="flex items-start justify-between gap-6 mb-5"><h3 className="text-15 font-heading">Add a Slack channel</h3><Button type="button" onClick={onClose}>Cancel</Button></div>
        {!connections.length ? <p role="status">No qualified Slack connection is configured. A verified app and its six read tools are required before collection can start.</p> : <>
            <label className={cx(fieldLabel,"mb-4")}>Slack connection<Select className={selectField} value={connection} onChange={e => setConnection(e.target.value)}>{connections.map(c => <option key={c.id} value={c.id}>{c.workspace} · {c.appId}</option>)}</Select></label>
            <div className="grid grid-cols-2 gap-4 my-4 max-compact:grid-cols-1"><label className={cx(fieldLabel,"mb-4")}>Channel name<input className={cx(field, "rounded-6 bg-field p-3 text-12 focus-visible:outline-focus")} autoFocus required pattern="[a-z0-9_-]+" placeholder="cec-team" value={name} onChange={e => setName(e.target.value.replace(/^#/, ''))}/></label><label className={cx(fieldLabel,"mb-4")}>Channel ID<input className={cx(field, "rounded-6 bg-field p-3 text-12 focus-visible:outline-focus")} required pattern="[CG][A-Z0-9]+" placeholder="C0123456789" value={channel} onChange={e => setChannel(e.target.value)}/></label></div>
            {project === 'brain' && <label className={cx(fieldLabel,"mb-4")}>Destination<Select className={selectField} value={destination} onChange={e => setDestination(e.target.value)}><option value="project-evidence">Private project evidence</option><option value="technical-brain">Technical Brain capture and review</option></Select></label>}
            {destination === 'technical-brain' && <><p className="my-3 text-11 leading-body text-muted">Technical sources stay in Brain’s private review workflow. Employees receive published notes after review and merge.</p><label className={cx(fieldLabel,"mb-4")}>Technical domains, separated by commas<input className={cx(field, "rounded-6 bg-field p-3 text-12 focus-visible:outline-focus")} required value={domains} onChange={e => setDomains(e.target.value)}/></label></>}
            <p className={cx(mutedCopy,"my-4")}>Harper verifies the workspace and channel before reading. Sharing this channel later adds a subscription to the same collection stream.</p>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? 'Saving…' : 'Add channel'}</Button>
        </>}
    </form>;
}
