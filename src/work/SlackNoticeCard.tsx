import { slackMessageUrl, type MergeNotice, type SlackDelivery } from '../shared';
import { Card, TextLink, summary } from '../ui';

/** Historical notice state stays intact; current presentation follows validated closeout evidence. */
export function SlackNoticeCard({ notice: n, deliveries }: { notice: MergeNotice; deliveries: SlackDelivery[] }) {
    const replacement = deliveries.find(d => d.requestId === n.id && d.supersession && slackMessageUrl(d.supersession.permalink, d.supersession.channelId, d.supersession.messageTs))?.supersession;
    return <Card as="article"><strong className="text-11 leading-relaxed">{n.kind === 'goal' ? n.goalTitle : n.kind === 'maintenance' ? 'Maintenance completed' : n.key} · Slack {replacement ? 'superseded by verified follow-up' : n.status}</strong>
        {replacement ? <><TextLink href={replacement.permalink} target="_blank" rel="noreferrer">View verified follow-up</TextLink><details><summary className={summary}>Original send outcome unknown</summary><p className="leading-body">{n.detail}</p></details></> : <p className="leading-body">{n.detail}</p>}
    </Card>;
}
