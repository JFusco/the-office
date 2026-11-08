import { ExternalLink } from '../ui/icons';
import { TextLink, cx } from '../ui';
import { slackMessageUrl, type SlackDelivery } from '../shared';

export function SlackDeliveryCard({ delivery: d }: { delivery: SlackDelivery }) {
    const replacement = d.supersession && slackMessageUrl(d.supersession.permalink, d.supersession.channelId, d.supersession.messageTs) ? d.supersession : undefined;
    const warning = d.status === 'uncertain' && !replacement;
    const label = replacement ? 'Superseded by verified follow-up' : d.status === 'confirmed' ? 'Sent on Slack' : warning ? 'Slack delivery needs read-back' : d.status === 'verifying' ? 'Checking Slack delivery…' : 'Sending to Slack…';
    return <aside className={cx('my-3 flex flex-col gap-2 rounded-8 border p-3 text-12 wrap-anywhere', warning ? 'border-slack-uncertain-line bg-slack-uncertain' : 'border-slack-line bg-slack')} aria-label="Slack delivery">
        <strong>{label}</strong><span className="text-11 text-slack-meta">{d.targetType === 'channel' ? 'Channel' : 'Direct message'} · {d.targetName}</span>
        <blockquote className="border-l-2 border-slack-quote pl-2 leading-relaxed whitespace-pre-wrap">{d.text}</blockquote>
        {replacement ? <><TextLink className="self-start font-semibold" href={replacement.permalink} target="_blank" rel="noreferrer">View verified follow-up <ExternalLink size={13}/></TextLink><small>The original send outcome remains unknown. Its active warning was closed by this verified replacement.</small></> : d.status === 'confirmed' && slackMessageUrl(d.permalink, d.channelId, d.messageTs) ? <TextLink className="self-start font-semibold" href={d.permalink} target="_blank" rel="noreferrer">View sent message <ExternalLink size={13}/></TextLink> : null}
        {warning ? <small className="block text-11 leading-relaxed">The team will read back the original message before taking another action. It will not be resent automatically.</small> : null}
    </aside>;
}
