import { defineConfig } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const cache=join(homedir(),'Library/Caches/ms-playwright');
const installed=existsSync(cache)?readdirSync(cache).filter(x=>/^chromium-\d+$/.test(x)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1])).map(x=>join(cache,x,'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')).find(p=>existsSync(p)):undefined;
// By default the suite runs against an isolated fixture server (static build + in-memory
// synthetic API, see tests/browser/fixture-server.ts). It never targets the installed Office.
// Set OFFICE_TEST_BASE_URL only for a separately started isolated server
// (OFFICE_DATA_ROOT=<temp> OFFICE_NO_POLL=1 OFFICE_PORT=<port>).
const fixturePort=Number(process.env.OFFICE_FIXTURE_PORT||4460);
const external=process.env.OFFICE_TEST_BASE_URL;
export default defineConfig({testDir:'tests/browser',workers:1,timeout:60000,
  use:{baseURL:external||`http://127.0.0.1:${fixturePort}`,viewport:{width:1440,height:1000},reducedMotion:'reduce',headless:true,launchOptions:{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||installed,args:['--enable-unsafe-swiftshader']},trace:'retain-on-failure'},
  webServer:external?undefined:{command:`node --import tsx tests/browser/fixture-server.ts --port ${fixturePort} --dist ${process.env.OFFICE_FIXTURE_DIST||'dist'}`,url:`http://127.0.0.1:${fixturePort}/api/health`,reuseExistingServer:false,stdout:'ignore',stderr:'pipe'},
  reporter:'list'});
