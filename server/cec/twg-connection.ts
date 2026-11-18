import type { JiraBinding } from '../office/project-bindings-config';

type Connection = Pick<JiraBinding, 'site' | 'twgProfile'>;

/** The TWG login profile for this project's calls; empty means TWG's default login. */
export function twgProfile(binding: Connection): string[] {
    return binding.twgProfile ? ['--profile', binding.twgProfile] : [];
}

/** The TWG site and login profile for one of this project's Jira calls. */
export function twgConnection(binding: Connection): string[] {
    return ['--site', binding.site, ...twgProfile(binding)];
}
