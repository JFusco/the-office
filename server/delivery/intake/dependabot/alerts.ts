import { DEPENDABOT } from './qualify';

/** An open Dependabot alert, as far as the Office needs it. */
export interface DependabotAlert { number: number; createdAt: string; package: string; ecosystem: string; manifest: string; relationship: string; severity: string; advisory: string; summary: string; range: string; fixed: string; url: string }

export function dependabotAlert(raw: any): DependabotAlert | null {
    if (!Number.isInteger(raw?.number) || raw.state !== 'open' || !raw.dependency?.package?.name) return null;
    return {
        number: raw.number, createdAt: String(raw.created_at || ''), package: String(raw.dependency.package.name), ecosystem: String(raw.dependency.package.ecosystem || ''),
        manifest: String(raw.dependency.manifest_path || ''), relationship: String(raw.dependency.relationship || 'unknown'), severity: String(raw.security_advisory?.severity || 'unknown'),
        advisory: String(raw.security_advisory?.ghsa_id || ''), summary: String(raw.security_advisory?.summary || ''), range: String(raw.security_vulnerability?.vulnerable_version_range || ''),
        fixed: String(raw.security_vulnerability?.first_patched_version?.identifier || ''), url: String(raw.html_url || ''),
    };
}

/** How long Dependabot is given to open its own pull request before the Office treats the alert as work. */
export const ALERT_GRACE_MS = 24 * 60 * 60 * 1000;

/** Dependabot's own wording for an update of the package, in a title or a grouped body: "Bump x from", "Updates `x` from". A changelog that merely mentions the name does not count. */
const updates = (pull: any, name: string) => new RegExp(`\\b(?:bump|update)s?\\s+\`?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\`?\\s+from\\b`, 'i').test(`${pull.title || ''}\n${pull.body || ''}`);

/**
 * Alerts Dependabot has left without a pull request: open for longer than the grace period, with no
 * open Dependabot pull request that updates the package. An alert with an unreadable date waits.
 */
export function unansweredAlerts(alerts: readonly DependabotAlert[], pulls: readonly any[], now: Date): DependabotAlert[] {
    const bot = pulls.filter(pull => pull.user?.login === DEPENDABOT);
    return alerts.filter(alert => {
        const age = now.getTime() - Date.parse(alert.createdAt);
        return Number.isFinite(age) && age >= ALERT_GRACE_MS && !bot.some(pull => updates(pull, alert.package));
    });
}
