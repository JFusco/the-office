// Bounded guard for the Tailwind token conventions (see docs/frontend-styling.md).
// It scans frontend source only: src/**/*.{ts,tsx,css} and index.html.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT=join(import.meta.dirname,'../..');
const COLOR_TOKENS='src/tokens/colors.css';
// Runtime styling exceptions must be listed here with a reason. There are none in project
// source today: Motion and Drei write transforms/positions inside their own libraries.
const RUNTIME_STYLE_EXCEPTIONS:{file:string;pattern:RegExp;reason:string}[]=[];
// getComputedStyle is allowed only where tokens are resolved once at startup.
const COMPUTED_STYLE_READERS=['src/tokens/scene-colors.ts','src/main.tsx'];
// Component selectors from the pre-Tailwind stylesheet. They must not return as class names.
const LEGACY_CLASSES='activity-dots address-divider agent-label agent-last-report approach-summary avatar-callout avatar-portrait azure-screen board-link brand-mark chat-compose chat-inspector chat-message chat-question chat-receipt chat-recipients chat-send chat-session chat-ticket check-label connection conversation conversation-empty conversation-history coordination-settings delivery-path delivery-state dependency-link dependency-notice dock-chat dock-divider dock-mail dock-roster dock-spacer elevator-arrival elevator-controls elevator-door elevator-doors elevator-heading elevator-location elevator-shade empty-note envelope-card envelope-stamp error-text evidence-card eyebrow finding floating-bubble-surface floor-plan-label floor-updates full github-panel github-ticket-detail goal-actions goal-card goal-fields goal-form handoff-label health-failure health-next icon-button inbox-queue inbox-queue-card inspector inspector-scroll inspector-top intro-tags it-report it-specialist leadership-report log-entry log-line mail-empty mail-label meeting-label merge-approval muted notice office-address office-app office-dock office-drawer-layer office-intro office-life-label office-log office-pause office-world orbit-hint outbox-card outbox-detail outbox-history outbox-label panel-foot panel-icon pause-banner pipeline-card pipeline-stage pipeline-timing pm-queue-button popover popover-title primary private-badge progress-freshness project-loading project-notes project-work project-working reduced-motion reply-recommendation room-label roster-avatar roster-item save-feedback scene-container scene-error scene-loading schedule secondary service-health-row shortcut slack-delivery small spin status-dot tag tag-row task-bubble task-bubble-text team-updates text-row ticket-actions ticket-discuss ticket-heading time-book time-build time-people time-sessions time-totals tiny-line toast topbar topbar-right tour-banner tour-button tour-dot tour-notice update-time user-avatar wordmark work-evidence work-packet work-summary world-tools'.split(' ');

function files(dir:string):string[]{return readdirSync(dir).flatMap(name=>{const path=join(dir,name);return statSync(path).isDirectory()?files(path):[path];});}
const sources=[...files(join(ROOT,'src')).filter(p=>/\.(tsx?|css)$/.test(p)),join(ROOT,'index.html')].map(path=>({path:relative(ROOT,path),text:readFileSync(path,'utf8')}));
const code=(text:string)=>text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/.*$/gm,'$1');
const lineOf=(text:string,index:number)=>text.slice(0,index).split('\n').length;
function findAll(pattern:RegExp,filter:(path:string)=>boolean=()=>true){
  return sources.filter(f=>filter(f.path)).flatMap(f=>[...code(f.text).matchAll(pattern)].map(m=>`${f.path}:${lineOf(code(f.text),m.index!)} ${m[0]}`));
}
// Quoted or template strings whose every token looks like a utility class.
function classStrings(text:string){
  return [...code(text).matchAll(/(['"`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)].map(m=>m[2]).filter(s=>{const tokens=s.replace(/\$\{[^}]*\}/g,' ').trim().split(/\s+/).filter(Boolean);return tokens.length>0&&tokens.every(t=>/^[!-]?[a-z0-9:[\]/().%_#-]+$/.test(t))&&tokens.some(t=>/[-:]/.test(t));});
}

describe('UI source guard',()=>{
  it('keeps literal colors in the color token file only',()=>{
    const literal=/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(|\b0x[0-9a-f]{6}\b|['"](?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|brown|tan|navy|teal|silver|gold)['"]/gi;
    expect(findAll(literal,p=>p!==COLOR_TOKENS)).toEqual([]);
  });
  it('uses no arbitrary values on color utilities',()=>{
    expect(findAll(/\b(?:bg|text|border(?:-[trblxy])?|outline|ring|inset-ring|shadow|fill|stroke|from|via|to|decoration|accent|caret|placeholder|divide|scrollbar-thumb|scrollbar-track)-\[/g,p=>p.endsWith('.tsx')||p.endsWith('.ts'))).toEqual([]);
  });
  it('builds class names from complete static strings',()=>{
    expect(findAll(/\b(?:bg|text|border|outline|ring|from|via|to|w|h|p[xytrbl]?|m[xytrbl]?|gap|rounded|shadow)-\$\{/g,p=>p.endsWith('.tsx')||p.endsWith('.ts'))).toEqual([]);
  });
  it('defines no presentation class selectors, @apply or @utility in CSS',()=>{
    const css=sources.filter(f=>f.path.endsWith('.css'));
    expect(css.map(f=>f.path).sort()).toEqual(['src/style.css','src/tokens/colors.css','src/tokens/effects.css','src/tokens/layout.css','src/tokens/typography.css']);
    const offenders=css.flatMap(f=>{const text=code(f.text).replace(/url\([^)]*\)/g,'').replace(/(['"])[^'"]*\1/g,'');return [...text.matchAll(/(?<![\w\\])\.[a-z_-][\w-]*|@apply\b|@utility\b/gi)].map(m=>`${f.path}: ${m[0]}`);});
    expect(offenders).toEqual([]);
    const base=code(sources.find(f=>f.path==='src/style.css')!.text).match(/@layer base\s*{([\s\S]*)}\s*$/)?.[1]||'';
    expect([...base.matchAll(/([^{}]+){/g)].map(m=>m[1].trim())).toEqual(['html']);
  });
  it('does not reintroduce legacy component class names',()=>{
    const legacy=new Set(LEGACY_CLASSES);
    const offenders=sources.filter(f=>/\.tsx?$/.test(f.path)).flatMap(f=>classStrings(f.text).flatMap(s=>s.split(/\s+/).filter(t=>legacy.has(t)).map(t=>`${f.path}: ${t}`)));
    expect(offenders).toEqual([]);
  });
  it('has no static inline styles; runtime exceptions are documented',()=>{
    const inline=/\bstyle=\{|\bstyle="|\.style\.|\.style\s*=|setAttribute\(\s*['"]style|cssText/g;
    const offenders=findAll(inline,p=>/\.tsx?$/.test(p)||p.endsWith('.html')).filter(o=>!RUNTIME_STYLE_EXCEPTIONS.some(e=>o.startsWith(e.file)&&e.pattern.test(o)));
    expect(offenders).toEqual([]);
    expect(findAll(/getComputedStyle\(/g,p=>/\.tsx?$/.test(p)&&!COMPUTED_STYLE_READERS.includes(p))).toEqual([]);
  });
  it('scopes transitions instead of transitioning everything',()=>{
    const offenders=sources.filter(f=>/\.tsx?$/.test(f.path)).flatMap(f=>classStrings(f.text).flatMap(s=>s.split(/\s+/).filter(t=>/(^|:)transition(-all)?$/.test(t)).map(t=>`${f.path}: ${t}`)));
    expect(offenders).toEqual([]);
  });
  it('keeps baseline values for roles that a palette merge once replaced',()=>{
    // Only contrast failures may re-pair a role; these roles pass and must keep their exact baseline colors.
    const css=sources.find(f=>f.path===COLOR_TOKENS)!.text;
    const palette=new Map([...css.matchAll(/--(palette-[a-z0-9-]+): (#[0-9a-f]+);/g)].map(m=>[m[1],m[2]]));
    expect(new Set(palette.values()).size).toBe(palette.size);
    const value=(token:string)=>{const ref=css.match(new RegExp(`--color-${token}: var\\(--(palette-[a-z0-9-]+)\\);`))?.[1];return ref&&palette.get(ref);};
    const baseline:Record<string,string>={'pill-line':'#cbd5c3','badge-line':'#cbd5c7','board-link-hover-line':'#91a78e','address-focus':'#537765','control-line':'#ccd5c3',
      finding:'#f5f7ee','finding-line':'#e0e7d6',compose:'#fffef9','compose-ink':'#374638','compose-focus':'#75956e','chat-select-line':'#d9ded2','chat-select-ink':'#37473d',
      'chat-field':'#fffdf7','time-select':'#fffdf5','goal-select-line':'#cbd4c4',field:'#fffef7',line:'#e3e7df',dock:'#f9faf3',checkbox:'#527345'};
    expect(Object.fromEntries(Object.keys(baseline).map(token=>[token,value(token)]))).toEqual(baseline);
  });
  it('resolves scene colors from tokens once, not per frame',()=>{
    const scene=code(sources.find(f=>f.path==='src/tokens/scene-colors.ts')!.text);
    expect(scene).toMatch(/if\(cache\)return cache;/);
    const css=sources.find(f=>f.path===COLOR_TOKENS)!.text;
    const names=[...scene.matchAll(/'(--(?:scene|color)-[a-z0-9-]+)'/g)].map(m=>m[1]);
    expect(names.length).toBeGreaterThan(100);
    expect(names.filter(name=>!new RegExp(`${name}:`).test(css))).toEqual([]);
  });
});
