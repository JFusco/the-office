import { Settings2 } from '../../ui/icons';
import { PanelHeader } from '../../ui/PanelHeader';
import type { OfficeSnapshot } from '../../shared';
import { Notice, PanelTitle, Section, SectionTitle, mutedCopy } from '../../ui';
import { GoalNoticeForm } from './GoalNoticeForm';
import { MergeCloseoutForm } from './MergeCloseoutForm';
import { OfficeConfigSection } from './OfficeConfigSection';
import { OfficePreferencesForm } from './OfficePreferencesForm';
import { PickupForm } from './PickupForm';
import { SlackNoticesForm } from './SlackNoticesForm';
import { SlackChannelForm } from './SlackChannelForm';
import { TimeForm } from './TimeForm';
import type { OfficePreferencesController } from './useOfficePreferences';

function ProjectForms({ snapshot, refresh }: { snapshot: OfficeSnapshot; refresh?: () => Promise<void> }) {
  return <div className="grid gap-6">
    <PickupForm snapshot={snapshot} refresh={refresh} />
    {snapshot.project?.provider === 'github' ? <MergeCloseoutForm snapshot={snapshot} refresh={refresh} /> : null}
    <SlackNoticesForm snapshot={snapshot} refresh={refresh} />
    <SlackChannelForm snapshot={snapshot} refresh={refresh} />
    <GoalNoticeForm snapshot={snapshot} refresh={refresh} />
    <TimeForm snapshot={snapshot} refresh={refresh} />
  </div>;
}

/** Settings drawer: Office preferences, read-only Office configuration, then this project's settings. */
export function SettingsPanel({ snapshot, preferences, osReduced, refresh }: { snapshot: OfficeSnapshot; preferences: OfficePreferencesController; osReduced: boolean; refresh?: () => Promise<void> }) {
  const tour = snapshot.mode === 'demo';
  return <>
    <PanelHeader icon={<Settings2 size={26}/>}>Settings</PanelHeader>
    <Section data-settings-block="office"><SectionTitle className="mb-4">Office</SectionTitle>
      {preferences.displayed ? <OfficePreferencesForm preferences={preferences.displayed} osReduced={osReduced} pending={preferences.pending} feedback={preferences.feedback} writable={preferences.writable} onChange={patch => void preferences.save(patch)} /> : <p className={mutedCopy} role="status">Loading Office preferences…</p>}
    </Section>
    <Section data-settings-block="configuration"><SectionTitle className="mb-4">Office configuration</SectionTitle><OfficeConfigSection /></Section>
    <Section data-settings-block="project"><SectionTitle className="mb-4">{tour ? 'Project' : `Project · ${snapshot.project?.name || 'Loading'}`}</SectionTitle>
      {tour ? <Notice tone="tour">Project settings are unavailable during the illustrative tour. Return to the live office to change them.</Notice> : <ProjectForms key={snapshot.project?.id} snapshot={snapshot} refresh={refresh} />}
    </Section>
  </>;
}
