import type { Role } from '../shared';
/** Per-person initial tile colors, shared by the dock roster, the directory and the org chart. */
export const ROSTER_AVATAR:Record<Role,string>={pm:'bg-roster-pm text-roster-avatar-ink',lead:'bg-roster-lead text-roster-avatar-ink',qa:'bg-roster-qa text-roster-avatar-ink',cto:'bg-roster-cto text-roster-cto-ink',developer:'bg-roster-default text-roster-avatar-ink',it:'bg-roster-it text-roster-it-ink',analyst:'bg-roster-default text-roster-avatar-ink',knowledge:'bg-roster-knowledge text-roster-knowledge-ink'};
// The initial is drawn by a pseudo-element so it stays out of the button's visible label text.
export const rosterAvatar='relative grid h-9 w-8.25 place-items-center rounded-10 font-display text-17 font-bold inset-shadow-avatar before:content-[attr(data-initial)] max-compact:h-7.25 max-compact:w-6.75 max-compact:rounded-7 max-compact:text-14';
