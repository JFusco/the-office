import type { OfficeConfigProjectSettings, OfficeProject } from '../../../../src/shared';

/**
 * The dependency bots whose PRs the Office can adopt without a person moving each card. Start-up validation
 * (`server/office/local-config.ts`) reads this tuple while the config modules load, so this module has type
 * imports only: callers pass the hands-off value they resolved.
 */
export const AUTO_ADOPT_BOTS = ['dependabot', 'pin-courier', 'wiki-sync'] as const;
export type AutoAdoptBot = typeof AUTO_ADOPT_BOTS[number];
export type EffectiveAutoAdopt = OfficeConfigProjectSettings['autoAdopt'];

/**
 * Which bots this project adopts automatically, and why. Only a hands-off GitHub project with a configured board
 * adopts at all (`source: 'none'` otherwise, whatever is configured). There an explicit `autoAdopt` wins as
 * written, `[]` included; omitting it adopts every supported bot.
 */
export function effectiveAutoAdopt(project: Pick<OfficeProject, 'provider' | 'autoAdopt' | 'githubProject'>, handsOff: boolean): EffectiveAutoAdopt {
    if (project.provider !== 'github' || !handsOff || !project.githubProject)
        return { bots: [], source: 'none' };
    if (project.autoAdopt !== undefined)
        return { bots: [...project.autoAdopt], source: 'explicit' };
    return { bots: [...AUTO_ADOPT_BOTS], source: 'default' };
}
