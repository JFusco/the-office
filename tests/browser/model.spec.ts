import { expect, test } from '@playwright/test';
test('Alex shows his configured implementation model in the selected desk details',async({page,request})=>{
  const state=await(await request.get('/api/office')).json();expect(state.agents.find((a:any)=>a.id==='developer')).toMatchObject({provider:'claude',model:'claude-opus-5-5',effort:'medium'});
  await page.goto('/');await page.getByRole('button',{name:'Visit Alex, Developer',exact:true}).click();await expect(page.getByRole('heading',{name:'Alex',exact:true})).toBeVisible();await expect(page.locator('[data-panel-foot]')).toContainText('Configured model: Opus 5.5 · medium effort');
});
