import type { OfficeSnapshot } from '../../shared';
import { ROLE_NAMES } from '../../shared';
import type { InspectorProps } from './inspector-props';

export function selectionTitle(selection: InspectorProps['selection'], snapshot: OfficeSnapshot, names = ROLE_NAMES) {
  switch (selection.kind) {
    case 'features':
      return snapshot.features?.find((feature) => feature.id === selection.id)?.title || selection.initialFeature?.title || 'Features';
    case 'agent':
      return snapshot.agents.find((agent) => agent.id === selection.id)?.name || names[selection.id];
    case 'azure':
      return snapshot.project?.provider === 'github' ? 'GitHub operations' : 'Azure operations';
    case 'chat':
      return 'Chat with ' + names[selection.role || 'pm'];
    case 'cto-chat':
      return 'Chat with ' + names.cto;
    case 'outbox':
      return selection.id
        ? snapshot.outbox.find((item) => item.id === selection.id)?.title || 'Question'
        : 'Your outbox';
    case 'ticket':
      return selection.id;
    case 'health':
      return 'Service health';
    case 'pm-queue':
      return 'PM queue';
    case 'goals':
      return 'Project goals';
    case 'settings':
      return selection.page === 'project' ? 'Project settings' : 'Settings';
    case 'people':
      return 'People';
    case 'telemetry':
      return 'Telemetry';
    case 'mailbox':
      return 'PM mailbox';
    case 'meeting':
      return 'Review table';
  }
}
