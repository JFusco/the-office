import { mkdirSync,writeFileSync,existsSync,readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
if(process.platform!=='darwin')throw new Error('The Office login service currently supports macOS.');
const root=fileURLToPath(new URL('../',import.meta.url)),label='com.jfusco.living-office';
const folder=resolve(homedir(),'Library/LaunchAgents'),file=resolve(folder,`${label}.plist`),logs=resolve(root,'.local/service');
const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
if(existsSync(file)&&!readFileSync(file,'utf8').includes(xml(root)))throw new Error('An unrelated service uses this label; refusing to replace it.');
mkdirSync(folder,{recursive:true});mkdirSync(logs,{recursive:true,mode:0o700});
writeFileSync(file,`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array><string>${xml(process.execPath)}</string><string>--import</string><string>tsx</string><string>${xml(resolve(root,'server/index.ts'))}</string></array>
<key>WorkingDirectory</key><string>${xml(root)}</string>
<key>EnvironmentVariables</key><dict><key>PATH</key><string>${xml(process.env.PATH||'/usr/bin:/bin')}</string></dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/><key>ThrottleInterval</key><integer>30</integer>
<key>StandardOutPath</key><string>${xml(resolve(logs,'stdout.log'))}</string>
<key>StandardErrorPath</key><string>${xml(resolve(logs,'stderr.log'))}</string>
</dict></plist>`,{mode:0o600});
const domain=`gui/${process.getuid()}`;
try{execFileSync('launchctl',['print',`${domain}/${label}`],{stdio:'ignore'});console.log('Office login service is already loaded.');}
catch{execFileSync('launchctl',['bootstrap',domain,file],{stdio:'inherit'});console.log('Office login service installed and started.');}
