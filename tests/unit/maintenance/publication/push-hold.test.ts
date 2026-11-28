import { expect, test } from 'vitest';
import { maintenancePushHold } from '../../../../server/maintenance/publication/push-hold';
import { projectById } from '../../../../server/office/projects';

test('the CMS project is held by id or by repository; another project is not', () => {
    expect(maintenancePushHold(projectById('cms-field-vocabulary'))).toMatch(/CMS maintenance publication is held/);
    expect(maintenancePushHold({ id: 'cms-renamed', repository: 'JFusco/CMS-Field-Vocabulary' })).toMatch(/held/);
    expect(maintenancePushHold({ id: 'cms-field-vocabulary', repository: 'JFusco/moved' })).toMatch(/held/);
    expect(maintenancePushHold({ id: 'maintenance-fixture', repository: 'JFusco/maintenance-fixture' })).toBeUndefined();
});
