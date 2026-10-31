import {itAgent} from '../health/it-agent';
import { avatarHome, SPOTS, sceneHandoff, sceneNow } from './scene-motion';
import { useAvatarMotion } from './useAvatarMotion';
import { LiveAgentTask } from './LiveAgentTask';
import { withoutElapsed } from './agent-activity';
export { SPOTS } from './scene-motion';
import { mailboxWork } from '../work/work-summary';
import { createContext, memo, useContext, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html as DreiHtml, OrbitControls, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { STAGE_LABELS, STAGE_ROLE, STAGES, ROLE_NAMES, type Agent, type OfficeSnapshot, type Role } from '../shared';
import { sceneColors } from '../tokens/scene-colors';
import { StatusDot, cx, interactiveScene } from '../ui';
export type Selection={kind:'agent';id:Role}|{kind:'chat';ticket?:string}|{kind:'outbox';id?:string}|{kind:'mailbox'}|{kind:'health'}|{kind:'pm-queue'}|{kind:'azure'}|{kind:'ticket';id:string}|{kind:'meeting'}|{kind:'goals'}|{kind:'cto-chat'}|null;
const Party=createContext(false);
const FloorVisibility=createContext({active:true,revealed:true,travelling:false,reduced:false});
// Scene overlays fade with the elevator. Visibility transitions with the fade, so hidden
// labels leave the tab order once faded; the inactive floor's labels are not rendered.
function Html({children,...props}:ComponentProps<typeof DreiHtml>){
  const {active,revealed,travelling,reduced}=useContext(FloorVisibility);
  return <DreiHtml {...props}><div data-scene-overlay className={cx(!active&&'hidden',revealed?'visible opacity-100 duration-320':'invisible opacity-0 duration-180',travelling&&'pointer-events-none',reduced?'transition-none':'transition-[opacity,visibility] ease-fade')}>{children}</div></DreiHtml>;
}
type Vec=[number,number,number];
type SceneAgent=Agent;
const TEAM_COLOR={pm:'teamPm',developer:'teamDeveloper',lead:'teamLead',qa:'teamQa',cto:'teamCto',it:'teamIt'} as const;
const TEAM_SWATCH={pm:'bg-team-pm',developer:'bg-team-developer',lead:'bg-team-lead',qa:'bg-team-qa',cto:'bg-team-cto',it:'bg-team-it',ideas:'bg-scene-ideas',reports:'bg-scene-reports'};
const sceneLabel=`border ${interactiveScene}`;
function Box({pos=[0,0,0],size=[1,1,1],color,radius=0.03,...props}:{pos?:Vec;size?:Vec;color:string;radius?:number;[key:string]:any}){
  return <mesh position={pos} castShadow receiveShadow {...props}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.72}/></mesh>;
}
function Pot({position,scale=1}:{position:Vec;scale?:number}){
  const c=sceneColors();
  return <group position={position} scale={scale}><mesh position={[0,.25,0]} castShadow><cylinderGeometry args={[.27,.2,.5,12]}/><meshStandardMaterial color={c.potBody}/></mesh><mesh position={[0,.63,0]}><cylinderGeometry args={[.04,.04,.6,6]}/><meshStandardMaterial color={c.potStem}/></mesh>{[0,1,2,3,4].map(i=><mesh key={i} position={[Math.sin(i*2.4)*.18,.75+i*.12,Math.cos(i*2.4)*.18]} rotation={[i*.4,0,i*.5]} castShadow><sphereGeometry args={[.29,8,6]}/><meshStandardMaterial color={i%2?c.potLeafDark:c.potLeafLight}/></mesh>)}</group>;
}
function Chair({position,rotation=0,color}:{position:Vec;rotation?:number;color:string}){
  const c=sceneColors();
  return <group position={position} rotation={[0,rotation,0]}><Box pos={[0,.66,0]} size={[.7,.15,.65]} color={color}/><Box pos={[0,1,-.27]} size={[.7,.65,.13]} color={color}/><mesh position={[0,.35,0]}><cylinderGeometry args={[.06,.06,.6,8]}/><meshStandardMaterial color={c.chairMetal}/></mesh>{[0,1,2,3].map(i=><Box key={i} pos={[Math.sin(i*Math.PI/2)*.24,.1,Math.cos(i*Math.PI/2)*.24]} size={[.12,.13,.12]} color={c.chairMetal}/>)}</group>;
}
function StaplerPrank(){
  const jelly=useRef<THREE.Group>(null),started=useRef(-Infinity);
  const [pranks,setPranks]=useState(0),[reply,setReply]=useState(false);
  const {reduced,active,revealed,travelling}=useContext(FloorVisibility),{invalidate}=useThree(),c=sceneColors();
  const lines=['JIM!','That stapler is company property.','Michael is going to hear about this.'];
  useEffect(()=>{
    if(!pranks)return;
    setReply(true);
    const timer=setTimeout(()=>setReply(false),6000);
    return()=>clearTimeout(timer);
  },[pranks]);
  useFrame(()=>{
    if(!jelly.current)return;
    const age=(performance.now()-started.current)/1000;
    const wobble=!reduced&&active&&revealed&&!travelling&&age<1.5?Math.sin(age*24)*Math.exp(-age*3)*.18:0;
    jelly.current.scale.set(1+wobble,1-wobble,1+wobble);
    jelly.current.rotation.z=wobble*.5;
    if(wobble)invalidate();
  });
  const prank=()=>{started.current=performance.now();setPranks(count=>count+1);invalidate();};
  return <group position={[.6,1.12,.12]}>
    <mesh><cylinderGeometry args={[.4,.4,.035,32]}/><meshStandardMaterial color={c.prankPlate}/></mesh>
    <group ref={jelly} position={[0,.02,0]} onClick={event=>{event.stopPropagation();prank();}}>
      <Box pos={[0,.09,0]} size={[.34,.055,.11]} color={c.prankStapler}/>
      <Box pos={[0,.145,-.01]} size={[.33,.065,.1]} color={c.prankStapler} rotation={[0,0,-.15]}/>
      <mesh scale={[1,.85,1]}><sphereGeometry args={[.36,32,20,0,Math.PI*2,0,Math.PI/2]}/><meshPhysicalMaterial color={c.prankJelly} transparent opacity={.55} roughness={.15} metalness={0} clearcoat={1} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    </group>
    <Html center position={[1,.5,.1]} zIndexRange={[32,0]}><div className="relative w-max">
      {reply?<div role="status" data-stapler-reaction className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-bubble -translate-x-1/2 rounded-7 border border-bubble-line bg-bubble px-3 py-2 text-9 text-bubble-ink shadow-bubble"><strong>Dwight:</strong> {lines[(pranks-1)%lines.length]}</div>:null}
      <button type="button" aria-label="Poke Dwight’s stapler in jelly" onClick={prank} className={cx('min-h-6 rounded-7 border border-agent-label-line bg-agent-label px-2 py-1 text-8 text-agent-label-ink shadow-agent-label hover:bg-agent-label-hover',interactiveScene)}>Suspicious dessert</button>
    </div></Html>
  </group>;
}
function Desk({position,rotation=0,active=false,accent,double=false,pranked=false}:{position:Vec;rotation?:number;active?:boolean;accent:string;double?:boolean;pranked?:boolean}){
  const c=sceneColors();
  return <group position={position} rotation={[0,rotation,0]}>
    <Box pos={[0,1.03,0]} size={[2.05,.13,1.05]} color={c.deskTop}/>
    {[-.82,.82].map(x=><Box key={x} pos={[x,.5,0]} size={[.08,1,.75]} color={c.deskLeg}/>)}
    <Box pos={[.62,.67,.08]} size={[.55,.63,.65]} color={c.deskDrawer}/>
    {[0,1].map(i=><Box key={i} pos={[.62,.61+i*.22,.414]} size={[.2,.025,.015]} color={c.deskHandle}/>)}
    <Box pos={[double?-.4:0,1.59,-.23]} size={[1,.65,.075]} color={c.monitor}/>
    <Box pos={[double?-.4:0,1.59,-.185]} size={[.9,.54,.012]} color={active?c.screenActive:c.screenIdle}>
      <meshStandardMaterial color={active?c.screenActive:c.screenIdle} emissive={active?c.screenActiveGlow:c.screenIdle} emissiveIntensity={active?.35:.02}/>
    </Box>
    {double?<Box pos={[.65,1.58,-.24]} size={[.8,.58,.075]} color={c.monitorSecond}/>:null}
    <Box pos={[double?-.4:0,1.19,-.24]} size={[.11,.3,.09]} color={c.monitorStand}/>
    <Box pos={[0,1.12,.23]} size={[.68,.035,.24]} color={c.keyboard}/>
    {[0,1,2].map(i=><Box key={i} pos={[-.19+i*.17,1.143,.23]} size={[.11,.006,.14]} color={c.keyboardKey}/>)}
    {!pranked?<mesh position={[.75,1.23,.25]} castShadow><cylinderGeometry args={[.09,.08,.22,12]}/><meshStandardMaterial color={accent}/></mesh>:null}
    <Box pos={[-.72,1.13,.05]} size={[.35,.065,.45]} color={accent}/>{pranked?<StaplerPrank/>:null}
    <Chair position={[0,0,.93]} color={c.deskChair}/>
  </group>;
}
function Avatar({agent,snapshot,reduced,onSelect}:{agent:SceneAgent;snapshot:OfficeSnapshot;reduced:boolean;onSelect:()=>void}){
  const ref=useRef<THREE.Group>(null),armL=useRef<THREE.Group>(null),armR=useRef<THREE.Group>(null),legL=useRef<THREE.Group>(null),legR=useRef<THREE.Group>(null);
  const {active,revealed,travelling}=useContext(FloorVisibility);
  const initial=useRef(new THREE.Vector3(...avatarHome(agent.id)));
  useAvatarMotion(agent,snapshot,!reduced&&active&&revealed&&!travelling,ref,[armL,armR],[legL,legR],useContext(Party));
  const [hover,setHover]=useState(false);
  const c=sceneColors(),shirt=c[TEAM_COLOR[agent.id]],skin=c.avatarSkin;
  return <group ref={ref} position={initial.current} onClick={e=>{e.stopPropagation();onSelect();}} onPointerOver={e=>{e.stopPropagation();setHover(true);document.body.classList.add('cursor-pointer');}} onPointerOut={()=>{setHover(false);document.body.classList.remove('cursor-pointer');}}>
    <mesh position={[0,.73,0]} castShadow><capsuleGeometry args={[.25,.34,4,8]}/><meshStandardMaterial color={shirt}/></mesh>
    <mesh position={[0,1.25,0]} castShadow><sphereGeometry args={[.255,16,12]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[0,1.38,-.055]} castShadow><sphereGeometry args={[.25,12,8,0,Math.PI*2,0,1.65]}/><meshStandardMaterial color={agent.id==='lead'?c.avatarHairLead:c.avatarHair}/></mesh>
    {[-.09,.09].map(x=><mesh key={x} position={[x,1.27,.237]}><sphereGeometry args={[.018,8,8]}/><meshStandardMaterial color={c.avatarEye}/></mesh>)}
    {agent.id==='lead'?<><Box pos={[-.095,1.28,.245]} size={[.15,.09,.025]} color={c.avatarGlasses}/><Box pos={[.095,1.28,.245]} size={[.15,.09,.025]} color={c.avatarGlasses}/></>:null}
    {[-1,1].map(s=><group key={s} ref={s===-1?armL:armR} position={[s*.29,.9,0]}><Box pos={[0,-.14,0]} size={[.12,.42,.15]} color={shirt}/><mesh position={[0,-.38,0]}><sphereGeometry args={[.08,8,8]}/><meshStandardMaterial color={skin}/></mesh></group>)}
    {[-1,1].map(side=><group key={side} ref={side<0?legL:legR} position={[side*.13,.54,0]}><Box pos={[0,-.25,0]} size={[.17,.5,.18]} color={c.avatarLeg}/><Box pos={[0,-.465,.06]} size={[.19,.14,.29]} color={c.avatarShoe}/></group>)}
    <Html position={[0,1.92,0]} center zIndexRange={[30,0]}><div className="relative w-max">
      {agent.activity==='working'?<div className={cx('pointer-events-none absolute bottom-full left-1/2 mb-2 block w-max max-w-bubble -translate-x-1/2 overflow-hidden rounded-7 border border-bubble-line bg-bubble py-2 pr-4 pl-2 text-center text-8 leading-bubble wrap-anywhere whitespace-normal text-bubble-ink shadow-bubble',!reduced&&'animate-bubble-enter reduce-motion:animate-none')} title={withoutElapsed(agent.task)} role="status" aria-live="off" aria-label={`${agent.name} activity`} data-task-bubble><span key={withoutElapsed(agent.task)} className={cx('line-clamp-3',!reduced&&'animate-activity-appear reduce-motion:animate-none')}><LiveAgentTask agent={agent} snapshot={snapshot} compact visible={active&&revealed&&!travelling}/></span><span className={cx('absolute right-1 bottom-0.5 ml-1 inline-block',!reduced&&'animate-activity-pulse reduce-motion:animate-none')} aria-hidden="true">···</span></div>:null}
      <button type="button" data-scene-label="agent" className={cx('flex min-h-6 max-w-agent-label items-center gap-1 overflow-hidden rounded-15 border-agent-label-line bg-agent-label px-2 py-1 text-8 whitespace-nowrap text-agent-label-ink shadow-agent-label outline-2 hover:bg-agent-label-hover hover:outline-agent-label-outline',hover?'outline-agent-label-outline':'outline-transparent',sceneLabel)} onClick={onSelect} aria-label={`${agent.name}, ${agent.activity==='working'?(agent.ticket?`${agent.ticket}, working`:'working'):agent.activity}, ${agent.title}`}><StatusDot status={agent.activity}/>{' '}<strong className="font-heading">{agent.name}</strong>{' '}<span className="min-w-0 truncate border-l border-agent-label-rule pl-1 text-6 text-agent-label-detail">{agent.activity==='working'?agent.ticket:agent.activity}</span></button>
    </div></Html>
  </group>;
}
function ITDesk({snapshot,reduced,onSelect,name}:{snapshot:OfficeSnapshot;reduced:boolean;onSelect:()=>void;name:string}){
  const agent={...itAgent(snapshot),name:snapshot.agents.find(a=>a.id==='it')?.name||name};
  return <><Desk position={SPOTS.it} active={agent.activity==='working'} accent={sceneColors().teamIt}/><Avatar key={`${snapshot.mode}:${agent.name}`} agent={agent} snapshot={snapshot} reduced={reduced} onSelect={onSelect}/><RoomLabel position={[1.2,.2,-5.05]} name={`${agent.name.toUpperCase()} · IT SUPPORT`} sub="Connections & recovery" swatch="it" onClick={onSelect}/></>;
}
const ROUTES:[Role,Role][]=[['pm','developer'],['developer','lead'],['lead','qa'],['qa','developer'],['qa','pm']];
function WorkRoutes({snapshot,reduced,onSelect}:{snapshot:OfficeSnapshot;reduced:boolean;onSelect:(s:Selection)=>void}){
  const active=snapshot.tickets.find(t=>t.activity==='working');
  const destination=active?STAGE_ROLE[active.stage]:null;
  let source:Role|null=null;
  if(active){const index=STAGES.indexOf(active.stage);for(let i=index-1;i>=0;i--){const candidate=STAGE_ROLE[STAGES[i]];if(candidate!==destination){source=candidate;break;}}}
  const handoff=sceneHandoff(snapshot);const transferring=handoff&&Date.now()-Date.parse(handoff.at)<7500;const c=sceneColors();
  return <>{ROUTES.map(([from,to],i)=>{
    const isActive=!!active&&((source===from&&destination===to)||(source===to&&destination===from));
    const inTransfer=transferring&&((handoff.from===from&&handoff.to===to)||(handoff.from===to&&handoff.to===from));
    const a=SPOTS[from],b=SPOTS[to];const y=i===3?2.1:1.8;
    return <group key={`${from}-${to}`}>
      <QuadraticBezierLine start={[a[0],y,a[2]]} end={[b[0],y,b[2]]} mid={[(a[0]+b[0])/2,3.5+(i%2)*.4,(a[2]+b[2])/2]} color={isActive||inTransfer?c.routeActive:c.routeIdle} lineWidth={isActive||inTransfer?2:1.2} dashed dashSize={.12} gapSize={.14} transparent opacity={isActive||inTransfer?.9:.4}/>
      {isActive?<RoutePacket from={source!} to={destination!} ticket={active!.key} reduced={reduced} startedAt={handoff?.at||active!.observedAt} onSelect={()=>onSelect({kind:'ticket',id:active!.key})}/>:null}
    </group>;
  })}</>;
}
function AzureWall({snapshot,onSelect}:{snapshot:OfficeSnapshot;onSelect:()=>void}){
  const github=snapshot.project?.provider==='github',buildCount=github?snapshot.github?.runs.length||0:snapshot.azure.builds.length,prCount=github?snapshot.github?.prs.filter(p=>p.state==='open').length||0:snapshot.azure.prs.length;
  const status=github?(snapshot.github?.error?'Needs attention':snapshot.github?.status==='working'?'Checking GitHub':snapshot.github?.observedAt?'Connected':'Not connected'):snapshot.azure.error?'Needs attention':snapshot.azure.builds.some(b=>b.status!=='completed')?'Build running':snapshot.azure.observedAt?'Connected':'Not connected';
  const c=sceneColors();
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=224;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle=c.opsScreen;ctx.fillRect(0,0,512,224);ctx.fillStyle=c.opsTitle;ctx.font='500 21px sans-serif';ctx.fillText(github?'GITHUB ACTIONS':'AZURE PIPELINES',24,43);
    ctx.fillStyle=c.opsStatus;ctx.font='500 36px sans-serif';ctx.fillText(status,24,111);ctx.fillStyle=c.opsCounts;ctx.font='21px sans-serif';ctx.fillText(`${buildCount} runs   /   ${prCount} PRs`,24,177);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[status,github,buildCount,prCount,c]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <group position={[5.1,0,-6.3]} onClick={e=>{e.stopPropagation();onSelect();}}><Box pos={[0,1.75,0]} size={[3.7,1.6,.15]} color={c.opsFrame}/><mesh position={[0,1.75,.08]}><planeGeometry args={[3.48,1.4]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh></group>;
}
function RoutePacket({from,to,ticket,reduced,startedAt,onSelect}:{from:Role;to:Role;ticket:string;reduced:boolean;startedAt:string;onSelect:()=>void}){
  const ref=useRef<THREE.Group>(null);const a=SPOTS[from],b=SPOTS[to];
  useFrame(()=>{if(!ref.current)return;const age=startedAt?(Date.now()-Date.parse(startedAt))/4500:1;const t=reduced?1:THREE.MathUtils.smoothstep(Math.max(0,Math.min(1,age)),0,1);ref.current.position.set(THREE.MathUtils.lerp(a[0],b[0],t),1.8+4*.55*t*(1-t),THREE.MathUtils.lerp(a[2],b[2],t));});
  return <group ref={ref}><mesh><sphereGeometry args={[.065,10,10]}/><meshBasicMaterial color={sceneColors().packet}/></mesh><Html center position={[0,.27,0]} zIndexRange={[28,0]}><button type="button" className={cx('rounded-5 border-packet-line bg-packet px-2 py-1 text-8 font-semibold whitespace-nowrap text-packet-ink shadow-packet hover:border-packet-hover-line hover:bg-packet-hover',sceneLabel)} data-work-packet data-handoff-at={startedAt} onClick={onSelect}>{ticket}</button></Html></group>;
}
function RoomLabel({position,name,sub,swatch,onClick}:{position:Vec;name:string;sub:string;swatch:keyof typeof TEAM_SWATCH;onClick:()=>void}){
  return <Html position={position} center zIndexRange={[10,0]}><button type="button" data-scene-label="room" className={cx('rounded-6 border-room-label-line bg-room-label px-3 pt-2 pb-1.5 text-left text-7 font-heading tracking-caps-md whitespace-nowrap text-room-label-ink shadow-room-label hover:border-room-label-hover-line hover:bg-room-label-hover',sceneLabel)} onClick={onClick}><span aria-hidden="true" className={cx('mr-1.5 inline-block size-1.25 rounded-1',TEAM_SWATCH[swatch])}/>{name}{' '}<small className="mt-0.5 ml-2.75 block text-6 leading-relaxed font-regular tracking-fine text-room-label-detail">{sub}</small></button></Html>;
}
function Mailbox({snapshot,onSelect,reduced,pmName}:{snapshot:OfficeSnapshot;onSelect:()=>void;reduced:boolean;pmName:string}){
  const letter=useRef<THREE.Group>(null);const count=mailboxWork(snapshot).queued;const c=sceneColors();
  useFrame(s=>{if(letter.current&&!reduced)letter.current.position.y=1.88+Math.sin(s.clock.elapsedTime*2)*.07;});
  return <group position={[2.7,0,5.9]} onClick={e=>{e.stopPropagation();onSelect();}}>
    <Box pos={[0,.53,0]} size={[.22,1.06,.23]} color={c.mailPost}/><Box pos={[0,.08,0]} size={[.7,.12,.6]} color={c.mailPost}/>
    <Box pos={[0,1.35,0]} size={[1,.75,.75]} color={c.mailBody} radius={.15}/>
    <Box pos={[0,1.4,.388]} size={[.66,.095,.025]} color={c.mailSlot}/>
    <Box pos={[.56,1.56,0]} size={[.05,.36,.25]} color={count?c.mailFlagUp:c.mailFlagDown}/>
    {count?<group ref={letter} position={[0,1.88,0]} rotation={[-.1,0,.14]}><Box size={[.65,.42,.055]} color={c.letter}/><mesh position={[0,0,.032]} rotation={[0,0,Math.PI/4]}><planeGeometry args={[.25,.25]}/><meshStandardMaterial color={c.letterFlap}/></mesh></group>:null}
    <Html position={[0,2.5,0]} center zIndexRange={[15,0]}><button type="button" data-scene-label="mail" className={cx(mailLabel,'border-mail-label-line')} onClick={onSelect} aria-label={`PM mailbox, ${count?`${count} queued for ${pmName}`:'No queued reviews'}`}><span className="mb-0.5 block text-6 tracking-caps-lg">PM MAILBOX</span>{' '}<strong className="text-9 font-heading">{count?`${count} queued for ${pmName}`:'No queued reviews'} <span aria-hidden className="ml-2">↗</span></strong></button></Html>
  </group>;
}
const mailLabel=cx('rounded-6 bg-mail-label px-2.5 py-2 text-left whitespace-nowrap text-mail-label-ink shadow-mail-label hover:border-mail-label-hover-line hover:bg-mail-label-hover',sceneLabel);
function HumanOutbox({snapshot,onSelect}:{snapshot:OfficeSnapshot;onSelect:()=>void}){
  const count=snapshot.outbox.filter(a=>a.status==='open').length,c=sceneColors();
  return <group position={[-.3,0,5.7]} onClick={e=>{e.stopPropagation();onSelect();}}>
    <Box pos={[0,.6,0]} size={[1.4,1.2,.75]} color={c.outboxBase}/>
    <Box pos={[0,1.24,0]} size={[1.65,.09,1]} color={c.outboxTop}/>
    <Box pos={[0,1.34,-.26]} size={[1.2,.13,.12]} color={c.outboxRail}/>
    {[-.56,.56].map(x=><Box key={x} pos={[x,1.34,0]} size={[.12,.13,.62]} color={c.outboxRail}/>)}
    {Array.from({length:Math.min(count,5)},(_,i)=><Box key={i} pos={[0,1.32+i*.055,0]} size={[.87,.035,.48]} color={i%2?c.outboxPaper:c.letter}/>)}
    <Html position={[0,2.3,0]} center zIndexRange={[15,0]}><button type="button" data-scene-label="mail" className={cx(mailLabel,'border-outbox-label-line')} onClick={onSelect} aria-label={`Your outbox, ${count?`${count} needs you`:'All clear'}`}><span className="mb-0.5 block text-6 tracking-caps-lg text-outbox-label-ink">YOUR OUTBOX</span>{' '}<strong className="text-9 font-heading">{count?`${count} needs you`:'All clear'} <span aria-hidden className="ml-2">↗</span></strong></button></Html>
  </group>;
}
function Handoff({snapshot,reduced}:{snapshot:OfficeSnapshot;reduced:boolean}){
  const {invalidate}=useThree();
  const {active,revealed,travelling}=useContext(FloorVisibility);
  const ref=useRef<THREE.Group>(null);const label=useRef<HTMLSpanElement>(null);const handoff=sceneHandoff(snapshot);
  useFrame(()=>{if(!ref.current||!handoff)return;const now=sceneNow(snapshot,performance.now(),Date.now());const t=now===null?1:(now-Date.parse(handoff.at))/5500;ref.current.visible=!reduced&&active&&revealed&&!travelling&&t>=0&&t<1;
    label.current?.classList.toggle('invisible',!ref.current.visible);
    if(ref.current.visible)invalidate();
    const from=SPOTS[handoff.from],to=SPOTS[handoff.to];const ease=t*t*(3-2*t);ref.current.position.set(THREE.MathUtils.lerp(from[0],to[0],ease),2+Math.sin(Math.PI*t)*.55,THREE.MathUtils.lerp(from[2],to[2],ease));ref.current.rotation.y=.1;
  });
  if(reduced||!handoff)return null;
  return <group ref={ref} visible={false}><Box size={[.6,.4,.05]} color={sceneColors().handoff}/><Html center position={[0,.6,0]}><span ref={label} className="rounded-4 bg-handoff px-1.5 py-0.5 text-8 whitespace-nowrap text-handoff-ink">{handoff.ticket}</span></Html></group>;
}
const Furnishings=memo(function Furnishings(){const c=sceneColors();return <>
  <Box pos={[0,-.38,0]} size={[18.6,.65,13.8]} color={c.plinth} radius={.25}/>
  <Box pos={[0,-.05,0]} size={[18.25,.16,13.5]} color={c.floor} radius={.16}/>
  {Array.from({length:25},(_,i)=><Box key={i} pos={[-8.7+i*.72,.035,0]} size={[.018,.007,13.15]} color={c.floorPlank} radius={.001}/>)}
  <Box pos={[0,1.22,-6.55]} size={[18.25,2.45,.18]} color={c.wallBack}/>
  <Box pos={[-9,1.22,0]} size={[.18,2.45,13.1]} color={c.wallSide}/>
  <Box pos={[0,2.5,-6.55]} size={[18.4,.12,.28]} color={c.wallTrim}/>
  <Box pos={[-9,2.5,0]} size={[.28,.12,13.4]} color={c.wallTrim}/>
  {/* Distinct team rugs, shared circulation, and a central review table. */}
  <Box pos={[-5.7,.06,1]} size={[5.4,.025,7.3]} color={c.rugDevelopment} radius={.14}/>
  <Box pos={[5.8,.06,-3]} size={[5,.025,5.9]} color={c.rugQa} radius={.14}/>
  <Box pos={[5.6,.06,3.7]} size={[5.2,.025,4.6]} color={c.rugPm} radius={.14}/>
  <Box pos={[-3.6,.06,-4.1]} size={[6.5,.025,3.3]} color={c.rugLead} radius={.14}/>
  <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[2.25,48]}/><meshStandardMaterial color={c.tableGround}/></mesh>
  <group position={[0,0,0]}><mesh position={[0,.94,0]} castShadow><cylinderGeometry args={[1.35,1.35,.13,48]}/><meshStandardMaterial color={c.tableTop}/></mesh><mesh position={[0,.48,0]}><cylinderGeometry args={[.35,.52,.88,16]}/><meshStandardMaterial color={c.tableBase}/></mesh>
    <Box pos={[-.2,1.05,.1]} size={[.55,.03,.45]} color={c.tablePaper}/><Box pos={[.23,1.04,-.4]} size={[.4,.04,.3]} color={c.tableTablet}/>
    {[0,1,2,3].map(i=><Chair key={i} position={[Math.sin(i*Math.PI/2)*1.85,0,Math.cos(i*Math.PI/2)*1.85]} rotation={i*Math.PI/2+Math.PI} color={c.meetingChair}/>)}</group>
  <Box pos={[-8.7,1.5,-3.6]} size={[.07,1.4,3.1]} color={c.whiteboard}/>
  {[-4.6,-3.6,-2.6].map(z=><Box key={z} pos={[-8.63,1.5,z]} size={[.06,1.25,.025]} color={c.whiteboardSheet}/>)}
  <Box pos={[.1,1.45,-6.4]} size={[3.3,1.45,.09]} color={c.noticeBoard}/>
  {Array.from({length:9},(_,i)=><Box key={i} pos={[-.9+(i%3)*.85,1.9-Math.floor(i/3)*.35,-6.34]} size={[.45,.22,.02]} color={[c.noteSand,c.noteSage,c.noteClay][i%3]}/>)}
  <group position={[-7.3,0,-5.7]}><Box pos={[0,.7,0]} size={[2.1,1.4,.65]} color={c.shelf}/>{[.45,.95].map(y=><Box key={y} pos={[0,y,.37]} size={[2,.05,.58]} color={c.shelfBoard}/>)}{[0,1,2,3,4,5].map(i=><Box key={i} pos={[-.8+i*.28,1.15,.17]} size={[.16,.4,.3]} color={[c.bookSage,c.bookWheat,c.bookSky][i%3]}/>)}</group>
  <group position={[8.4,0,-5.6]}><Box pos={[0,.6,0]} size={[.8,1.2,.8]} color={c.cabinet}/><Box pos={[0,1.3,0]} size={[.7,.17,.7]} color={c.cabinetTop}/>{[0,1,2].map(i=><Box key={i} pos={[0,.35+i*.35,.42]} size={[.25,.025,.025]} color={c.cabinetHandle}/>)}</group>
  <group position={[-1.4,0,5.2]}><Box pos={[0,.42,0]} size={[2.6,.68,.9]} color={c.sofa}/><Box pos={[0,.85,-.35]} size={[2.6,.65,.2]} color={c.sofa}/>{[-1.2,1.2].map(x=><Box key={x} pos={[x,.72,0]} size={[.2,.4,1]} color={c.sofa}/>)}<Box pos={[.62,.86,0]} size={[.5,.4,.17]} color={c.cushion}/></group>
  <group position={[-4.5,0,5.3]}><Box pos={[0,.5,0]} size={[1.2,.9,.85]} color={c.coffeeStation}/><Box pos={[0,1.02,0]} size={[1.3,.1,.95]} color={c.coffeeCounter}/><Box pos={[0,1.32,-.1]} size={[.5,.5,.45]} color={c.coffeeMachine}/><mesh position={[.26,1.1,.2]}><cylinderGeometry args={[.09,.07,.22,10]}/><meshStandardMaterial color={c.coffeeCup}/></mesh></group>
  <Pot position={[-8.3,0,5.6]} scale={1.2}/><Pot position={[2.2,0,-5.7]} scale={1.25}/><Pot position={[8.3,0,.3]} scale={1.4}/><Pot position={[-8.2,0,-.1]} scale={.9}/>
  {/* Low partitions keep the room legible from the isometric camera. */}
  <Box pos={[2.8,.43,-3.9]} size={[.12,.85,3.4]} color={c.partitionLead}/>
  <Box pos={[5.5,.43,.55]} size={[5.4,.85,.12]} color={c.partitionPm}/>
  {[-8,-5,-2,1,4,7].map(x=><group key={x} position={[x,2,-6.4]}><Box size={[.07,1,.07]} color={c.lampPole}/><Box pos={[0,.4,.2]} size={[.65,.1,.65]} color={c.lampShade}/></group>)}
  <Box pos={[-6.5,.5,6.74]} size={[2.5,.4,.07]} color={c.bench}/>
</>});
// Background coworkers have no ticket ownership or work status. Their short trips
// request frames only while moving; an idle office keeps demand rendering.
function OfficeLife({reduced,quality}:{reduced:boolean;quality:string}) {
  return <>{[0,1].slice(0,quality==='high'?2:1).map(i=><Coworker key={i} index={i} reduced={reduced}/>)}</>;
}
function Coworker({index,reduced}:{index:number;reduced:boolean}) {
  const body=useRef<THREE.Group>(null),leftLeg=useRef<THREE.Group>(null),rightLeg=useRef<THREE.Group>(null),cup=useRef<THREE.Group>(null);
  const party=useContext(Party);
  const {invalidate}=useThree();const [outing,setOuting]=useState(false);
  const started=useRef(0),home=useMemo<Vec>(()=>index===0?[-7.1,0,4.05]:[6.6,0,-5.55],[index]);
  // Polyline sampling at a constant walking speed, with a pause for coffee.
  const path=useMemo(()=>{
    const points:Vec[]=index===0?[home,[-7.1,0,4.65],[-5.4,0,4.65],[-4.5,0,4.5]]:[home,[7.9,0,-5.55],[7.9,0,-.3],[8.45,0,-.3],[8.45,0,6.35],[-4.5,0,6.35],[-4.5,0,6.05]];
    const p=new THREE.CurvePath<THREE.Vector3>();for(let i=1;i<points.length;i++)p.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return p;
  },[home,index]);
  useEffect(()=>{
    if(reduced){setOuting(false);body.current?.position.set(...home);invalidate();return;}
    let timer:ReturnType<typeof setTimeout>;
    const schedule=(first=false)=>{timer=setTimeout(()=>{started.current=performance.now();setOuting(true);invalidate();timer=setTimeout(()=>{setOuting(false);schedule();invalidate();},(path.getLength()/.85*2+9)*1000);},first?(8+index*35+Math.random()*5)*1000:(45+Math.random()*40)*1000);};
    schedule(true);return()=>clearTimeout(timer);
  },[reduced,path,home,index,invalidate]);
  useFrame(()=>{
    if(!body.current)return;
    if(party&&!reduced&&!document.hidden){
      const phase=performance.now()/140+index*2;
      body.current.position.set(home[0],Math.abs(Math.sin(phase))*.6,home[2]);body.current.rotation.set(0,Math.sin(phase*.5)*.6,Math.sin(phase)*.12);
      if(leftLeg.current)leftLeg.current.rotation.x=Math.sin(phase)*.35;
      if(rightLeg.current)rightLeg.current.rotation.x=-Math.sin(phase)*.35;
      if(cup.current)cup.current.visible=false;
      invalidate();return;
    }
    body.current.rotation.z=0;
    if(reduced||!outing){body.current.position.set(...home);body.current.rotation.y=index?Math.PI:0;if(leftLeg.current)leftLeg.current.rotation.x=0;if(rightLeg.current)rightLeg.current.rotation.x=0;return;}
    const age=(performance.now()-started.current)/1000,travel=path.getLength()/.85,returning=age>travel+9;
    const progress=Math.max(0,Math.min(1,returning?1-(age-travel-9)/travel:age/travel));
    const point=path.getPoint(progress),walking=age<travel||returning;
    body.current.position.copy(point);body.current.position.y=walking?Math.sin(age*9)*.035:0;
    if(walking){const tangent=path.getTangent(progress);body.current.rotation.y=Math.atan2(tangent.x,tangent.z)+(returning?Math.PI:0);}
    else body.current.rotation.y=index?Math.PI:0;
    if(leftLeg.current)leftLeg.current.rotation.x=walking?Math.sin(age*9)*.42:0;
    if(rightLeg.current)rightLeg.current.rotation.x=walking?-Math.sin(age*9)*.42:0;
    if(cup.current){cup.current.visible=age>=travel;cup.current.position.y=!walking?1+Math.sin(age*1.5)*.07:.83;}
    invalidate();
  });
  const c=sceneColors(),shirt=index?c.coworkerShirtB:c.coworkerShirtA;
  return <group ref={body} position={home}>
    <mesh position={[0,.76,0]} castShadow><capsuleGeometry args={[.23,.34,3,8]}/><meshStandardMaterial color={shirt}/></mesh>
    <mesh position={[0,1.27,0]} castShadow><sphereGeometry args={[.235,12,10]}/><meshStandardMaterial color={index?c.coworkerSkinB:c.coworkerSkinA}/></mesh>
    <mesh position={[0,1.39,-.04]}><sphereGeometry args={[.235,10,8,0,Math.PI*2,0,1.6]}/><meshStandardMaterial color={index?c.coworkerHairB:c.coworkerHairA}/></mesh>
    {[-1,1].map(s=><group key={s} ref={s<0?leftLeg:rightLeg} position={[s*.12,.5,0]}><Box pos={[0,-.2,0]} size={[.16,.45,.17]} color={c.coworkerLeg}/><Box pos={[0,-.41,.05]} size={[.18,.12,.26]} color={c.coworkerShoe}/></group>)}
    {[-1,1].map(s=><Box key={s} pos={[s*.28,.75,.02]} size={[.12,.4,.16]} color={shirt}/>)}
    <group ref={cup} position={[.32,.83,.2]} visible={false}><mesh><cylinderGeometry args={[.085,.065,.18,10]}/><meshStandardMaterial color={c.coworkerCup}/></mesh><mesh position={[0,.093,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.067,10]}/><meshStandardMaterial color={c.coworkerCoffee} side={THREE.DoubleSide}/></mesh></group>
    {outing&&!reduced?<Html center position={[0,1.9,0]} zIndexRange={[5,0]} pointerEvents="none"><span className="block rounded-7 border border-life-label-line bg-life-label px-2 py-1 text-center text-9 whitespace-nowrap text-life-label-ink shadow-life-label" data-office-life>Coffee break<small className="block text-7 leading-relaxed text-life-label-detail">Office life</small></span></Html>:null}
  </group>;
}
function PartyConfetti(){
  const pieces=useRef<THREE.Group>(null),c=sceneColors();
  const colors=[c.teamPm,c.teamDeveloper,c.teamLead,c.teamQa,c.teamCto,c.teamIt];
  useFrame(({clock})=>{
    if(document.hidden)return;
    pieces.current?.children.forEach((piece,i)=>{
      const age=clock.elapsedTime*(.7+(i%5)*.09)+i*.37;
      piece.position.set(Math.sin(i*127.1)*8+Math.sin(age+i)*.4,7-(age%7),Math.cos(i*73.3)*6);
      piece.rotation.set(age*2+i,age+i,age*1.5);
    });
  });
  return <group ref={pieces}>{Array.from({length:100},(_,i)=><mesh key={i}><planeGeometry args={[.09,.16]}/><meshStandardMaterial color={colors[i%colors.length]} side={THREE.DoubleSide}/></mesh>)}</group>;
}
function Camera({focus,zoom}:{focus:Vec;zoom:number}){
  const controls=useRef<OrbitControlsImpl>(null);
  const {camera,invalidate,size}=useThree();
  const responsiveZoom=zoom*Math.min(1,size.width/1200);
  useEffect(()=>{if(controls.current){controls.current.target.set(...focus);controls.current.update();}if(camera instanceof THREE.OrthographicCamera){camera.zoom=responsiveZoom;camera.updateProjectionMatrix();}invalidate();},[focus,responsiveZoom,camera,invalidate]);
  return <OrbitControls ref={controls} makeDefault enableDamping maxPolarAngle={Math.PI*.44} minPolarAngle={Math.PI*.12} minZoom={8} maxZoom={100} maxDistance={60} minDistance={10}/>;
}
export type Floor='delivery'|'cto';
function ElevatorStage({floor,reduced,travelling,revealed,children}:{floor:Floor;reduced:boolean;travelling:boolean;revealed:boolean;children:(floor:Floor)=>ReactNode}) {
  const ref=useRef<THREE.Group>(null),initial=useRef(new THREE.Vector3(0,floor==='cto'?-18:0,0));
  const [displayed,setDisplayed]=useState(floor);const {invalidate}=useThree();
  useEffect(()=>{if(ref.current)ref.current.position.y=floor==='cto'?-18:0;setDisplayed(floor);invalidate();},[floor,invalidate]);
  return <group ref={ref} position={initial.current}>
    <FloorVisibility.Provider value={{active:displayed==='delivery',revealed,travelling,reduced}}><group visible={displayed==='delivery'}>{children('delivery')}</group></FloorVisibility.Provider>
    <FloorVisibility.Provider value={{active:displayed==='cto',revealed,travelling,reduced}}><group position={[0,18,0]} visible={displayed==='cto'}>{children('cto')}</group></FloorVisibility.Provider>
  </group>;
}
function CTORoom({snapshot,onSelect,reduced,pmName}:{snapshot:OfficeSnapshot;onSelect:(s:Selection)=>void;reduced:boolean;pmName:string}) {
  const c=sceneColors(),goals=(snapshot.ctoGoals||snapshot.goals||[]).filter(g=>g.status!=='done').sort((a,b)=>a.priority-b.priority).slice(0,6),agent=snapshot.agents.find(a=>a.id==='cto');
  return <>
    <Box pos={[0,-.38,0]} size={[18.6,.65,13.8]} color={c.plinth}/><Box pos={[0,-.05,0]} size={[18.25,.16,13.5]} color={c.ctoFloor}/>
    {Array.from({length:25},(_,i)=><Box key={i} pos={[-8.7+i*.72,.035,0]} size={[.018,.007,13.15]} color={c.ctoFloorPlank}/>)}
    <Box pos={[0,1.22,-6.55]} size={[18.25,2.45,.18]} color={c.ctoWallBack}/><Box pos={[-9,1.22,0]} size={[.18,2.45,13.1]} color={c.ctoWallSide}/>
    <Box pos={[-4.4,.06,-1.6]} size={[6.4,.025,6]} color={c.ctoRug}/><Desk position={SPOTS.cto} active={agent?.activity==='working'} accent={c.teamCto} double/>
    {agent?<Avatar agent={agent} snapshot={{...snapshot,lastHandoff:null}} reduced={reduced} onSelect={()=>onSelect({kind:'cto-chat'})}/>:null}
    <group position={[4.5,0,-5.7]} onClick={e=>{e.stopPropagation();onSelect({kind:'goals'});}}><Box pos={[0,1.5,0]} size={[6,2.25,.2]} color={c.goalsFrame}/><Box pos={[0,1.5,.12]} size={[5.75,2,.02]} color={c.goalsBoard}/>{goals.map((g,i)=><group key={g.id} position={[-1.8+(i%3)*1.8,1.95-Math.floor(i/3)*.85,.17]}><Box size={[1.45,.65,.03]} color={['',c.goalFirst,c.goalNext,c.goalLater,c.goalSomeday][g.priority]}/></group>)}<Html center position={[0,3,0]} zIndexRange={[10,0]}><button type="button" data-scene-label="mail" className={cx(mailLabel,'border-mail-label-line')} onClick={()=>onSelect({kind:'goals'})}><span className="mb-0.5 block text-6 tracking-caps-lg">PROJECT GOALS</span>{' '}<strong className="text-9 font-heading">{goals.length?`${(snapshot.ctoGoals||snapshot.goals||[]).filter(g=>g.status!=='done').length} goals & ideas`:'Add your first idea'} <span aria-hidden>↗</span></strong></button></Html></group>
    <group position={[4.5,0,2.8]}><Box pos={[0,.5,0]} size={[4.2,.8,1.2]} color={c.ideasSofa}/><Box pos={[0,1,-.45]} size={[4.2,.8,.25]} color={c.ideasSofa}/>{[-2,2].map(x=><Box key={x} pos={[x,.8,0]} size={[.3,.55,1.2]} color={c.ideasSofa}/>)}<Box pos={[0,.55,1.8]} size={[2.4,.15,1.2]} color={c.ideasTable}/><Box pos={[-.3,.65,1.8]} size={[.55,.04,.4]} color={c.ideasPaper}/></group>
    <group position={[-7.9,0,-5.6]}><Box pos={[0,1,0]} size={[1.5,2,.5]} color={c.bookcase}/>{[0,1,2,3].map(i=><group key={i}><Box pos={[0,.35+i*.43,.25]} size={[1.4,.05,.5]} color={c.bookcaseShelf}/>{[0,1,2,3].map(j=><Box key={j} pos={[-.5+j*.3,.58+i*.43,.15]} size={[.15,.37,.3]} color={[c.ctoBookSage,c.ctoBookTan,c.ctoBookSky,c.ctoBookMauve][(j+i)%4]}/>)}</group>)}</group>
    <Pot position={[-8,0,4.9]} scale={1.5}/><Pot position={[8.2,0,-.5]} scale={1.5}/><Pot position={[.3,0,-5.5]} scale={1.1}/>
    <RoomLabel position={[-4.5,.2,1.9]} name="CTO OFFICE" sub="Technology & direction" swatch="cto" onClick={()=>onSelect({kind:'cto-chat'})}/>
    <RoomLabel position={[4.5,.2,5.5]} name="IDEAS & POSSIBILITIES" sub="Dream a little bigger" swatch="ideas" onClick={()=>onSelect({kind:'goals'})}/>
    <RoomLabel position={[-4.7,.2,4.7]} name="DELIVERY REPORTS" sub={`${(snapshot.leadershipReports||[]).length} reports from ${pmName}`} swatch="reports" onClick={()=>onSelect({kind:'goals'})}/>
  </>;
}
export default function OfficeScene({snapshot,names=ROLE_NAMES,onSelect,reduced,quality,zoom,focus,floor='delivery',travelling=false,revealed=true,party=false,officeCast=false}:{snapshot:OfficeSnapshot;names?:Record<Role,string>;onSelect:(s:Selection)=>void;reduced:boolean;quality:string;zoom:number;focus:Vec;floor?:Floor;travelling?:boolean;revealed?:boolean;party?:boolean;officeCast?:boolean}){
  const moving=!reduced&&(party||snapshot.agents.some(a=>a.activity==='working'));
  const pmName=snapshot.agents.find(a=>a.id==='pm')?.name||names.pm;
  const c=sceneColors();
  return <Party.Provider value={party}><Canvas frameloop={moving?'always':'demand'} orthographic camera={{position:[18,18,22],zoom:45,near:.1,far:150}} shadows={quality==='high'} dpr={quality==='high'?[1,1.3]:[1,1]} gl={{antialias:quality==='high',alpha:true,powerPreference:'high-performance'}} onPointerMissed={()=>onSelect(null)}>
    <color attach="background" args={[c.backdrop]}/><fog attach="fog" args={[c.backdrop,55,110]}/>
    <ambientLight intensity={1.15}/><hemisphereLight args={[c.hemisphereSky,c.hemisphereGround,1.7]}/>
    <directionalLight position={[-8,18,7]} intensity={2.8} castShadow={quality==='high'} shadow-mapSize={[1024,1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-bias={-.001}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.74,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={c.backdrop}/></mesh>
    <ElevatorStage floor={floor} reduced={reduced} travelling={travelling} revealed={revealed}>{displayed=>displayed==='cto'?<CTORoom snapshot={snapshot} onSelect={onSelect} reduced={reduced} pmName={pmName}/>:<><Furnishings/>
    <OfficeLife reduced={reduced||floor==='cto'} quality={quality}/>
    <Desk position={SPOTS.developer} active={snapshot.agents.find(a=>a.id==='developer')?.activity==='working'} accent={c.teamDeveloper} double/>
    <Desk position={[-5.7,0,-1.8]} rotation={Math.PI} accent={c.teamDeveloper}/>
    <Desk position={[-7.1,0,3.2]} accent={c.teamDeveloper}/>
    <Desk pranked={officeCast} position={SPOTS.lead} active={snapshot.agents.find(a=>a.id==='lead')?.activity==='working'} accent={c.teamLead} double/>
    <Desk position={SPOTS.qa} active={snapshot.agents.find(a=>a.id==='qa')?.activity==='working'} accent={c.teamQa} double/>
    <Desk position={[6.6,0,-4.7]} rotation={Math.PI} accent={c.teamQa}/>
    <Desk position={SPOTS.pm} active={snapshot.agents.find(a=>a.id==='pm')?.activity==='working'} accent={c.teamPm}/>
    <ITDesk snapshot={snapshot} name={names.it} reduced={reduced} onSelect={()=>onSelect({kind:'agent',id:'it'})}/>
    <AzureWall snapshot={snapshot} onSelect={()=>onSelect({kind:'azure'})}/>
    <RoomLabel position={[-6,.2,4.65]} name="DEVELOPMENT" sub="Implementation" swatch="developer" onClick={()=>onSelect({kind:'agent',id:'developer'})}/>
    <RoomLabel position={[-3.6,.2,-5.45]} name="DEV LEAD" sub="Plan & code review" swatch="lead" onClick={()=>onSelect({kind:'agent',id:'lead'})}/>
    <RoomLabel position={[5.65,.2,-.25]} name="QA" sub="Browser testing" swatch="qa" onClick={()=>onSelect({kind:'agent',id:'qa'})}/>
    <RoomLabel position={[6.4,.2,5.55]} name="PROJECT MANAGEMENT" sub="Tickets & delivery" swatch="pm" onClick={()=>onSelect({kind:'agent',id:'pm'})}/>
    {/* The review table has no other control, so its label stacks above every other scene label. */}
    <Html position={[0,1.04,0]} center zIndexRange={[31,0]}><button type="button" data-scene-label="meeting" className={cx('min-h-6 rounded-3 border-meeting-label-line bg-meeting-label px-1 py-1 text-5 tracking-caps-sm whitespace-nowrap text-meeting-label-ink hover:border-meeting-label-hover-line hover:bg-meeting-label-hover',sceneLabel)} aria-label="Review table and team handoffs" onClick={()=>onSelect({kind:'meeting'})}>REVIEW TABLE</button></Html>
    {snapshot.agents.filter(a=>a.id!=='cto'&&a.id!=='it').map(a=><Avatar key={a.id} agent={a} snapshot={snapshot} reduced={reduced} onSelect={()=>onSelect({kind:'agent',id:a.id})}/>)}
    <WorkRoutes snapshot={snapshot} reduced={reduced} onSelect={onSelect}/>
    <HumanOutbox snapshot={snapshot} onSelect={()=>onSelect({kind:'outbox'})}/><Mailbox snapshot={snapshot} pmName={pmName} onSelect={()=>onSelect({kind:'mailbox'})} reduced={reduced}/>{!snapshot.tickets.some(t=>t.activity==='working')?<Handoff snapshot={snapshot} reduced={reduced}/>:null}
    </>}</ElevatorStage>
    {quality==='high'?<ContactShadows frames={1} position={[0,-.7,0]} opacity={.24} scale={40} blur={2.5} far={12} resolution={256} color={c.contactShadow}/>:null}
    {party&&!reduced?<PartyConfetti/>:null}
    <Camera focus={focus} zoom={zoom}/>
  </Canvas></Party.Provider>;
}
