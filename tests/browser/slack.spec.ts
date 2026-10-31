import { expect, test } from '@playwright/test';
import { evidence } from './support';
test('Slack confirmations link to verified messages; uncertain deliveries have no success link',async({page,request})=>{
  const state=await(await request.get('/api/office')).json();
  const base={from:'human',to:'pm',ticket:'',actionId:'',body:'Synthetic Slack UI fixture',status:'answered',createdAt:new Date().toISOString(),sessionId:'',recheck:false,error:'',recipients:[],receipts:[]};
  state.messages=[{...base,id:'slack-confirmed-fixture',requestId:'slack-confirmed-fixture'},{...base,id:'slack-uncertain-fixture',requestId:'slack-uncertain-fixture',status:'failed'}];
  state.slackDeliveries=[{id:'fixture-delivery',requestId:'slack-confirmed-fixture',targetType:'person',targetId:'UFIXTURE',targetName:'Joe Fixture',workspaceId:'TFIXTURE',text:'Synthetic mention <@UFIXTURE>',status:'confirmed',channelId:'DFIXTURE',messageTs:'1234567890.000001',permalink:'https://fixture.slack.com/archives/DFIXTURE/p1234567890000001'},
    {id:'fixture-uncertain',requestId:'slack-uncertain-fixture',targetType:'channel',targetId:'CFIXTURE',targetName:'#fixture',text:'Synthetic uncertain delivery',status:'uncertain',permalink:'https://evil.example/fake'}];
  await page.route('**/api/office',r=>r.fulfill({json:state}));await page.route('**/api/events',r=>r.fulfill({contentType:'text/event-stream',body:`event: snapshot\ndata: ${JSON.stringify(state)}\n\n`}));
  await page.goto('/');await page.getByRole('button',{name:'Chat with Morgan',exact:true}).click();
  const cards=page.getByRole('complementary',{name:'Slack delivery'});await expect(cards).toHaveCount(2);
  await expect(cards.first().getByRole('link',{name:'View sent message'})).toHaveAttribute('href',state.slackDeliveries[0].permalink);
  await expect(cards.first()).toContainText('Synthetic mention <@UFIXTURE>');await expect(cards.last()).toContainText('Slack delivery needs read-back');await expect(cards.last().getByRole('link')).toHaveCount(0);
  await page.getByRole('link',{name:'View sent message'}).focus();await expect(page.getByRole('link',{name:'View sent message'})).toBeFocused();
  await page.screenshot({path:evidence('office-slack-ui-fixture.png')});
});
test('occasional coffee breaks stay distinct from actual work and stop with reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{localStorage.setItem('office.motion','full');localStorage.setItem('office.quality','low');});
  await page.goto('/');const coffee=page.locator('[data-office-life]');await expect(coffee).toContainText('Coffee break',{timeout:25000});await expect(coffee).toContainText('Office life');
  await page.screenshot({path:evidence('office-coffee-break.png')});
  await page.getByRole('button',{name:'Office settings'}).click();await page.getByLabel('Reduced motion').check();await expect(coffee).toHaveCount(0);await page.keyboard.press('Escape');await expect(page.locator('canvas')).toBeVisible();
});
