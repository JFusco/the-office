import type { ReactNode } from 'react';
import { PanelIcon, PanelTitle } from './index';
/** Shared icon, title size and spacing for Office panel entry points. */
export function PanelHeader({ icon, children, tone = 'mail', id }: { icon: ReactNode; children: ReactNode; tone?: 'mail' | 'azure' | 'review'; id?: string }) {
    return <div data-panel-header><PanelIcon tone={tone}>{icon}</PanelIcon><PanelTitle id={id} className="mt-3 mb-2">{children}</PanelTitle></div>;
}
