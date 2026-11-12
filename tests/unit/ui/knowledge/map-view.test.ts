import { expect, it } from 'vitest';
import { displayScene, selectRecord, type MapSelection } from '../../../../src/knowledge/map/display-scene';
import { visibleLabels } from '../../../../src/knowledge/map/label-visibility';
import { cameraTarget, focusDistance, overviewDistance } from '../../../../src/knowledge/map/camera-target';
import { flightPose } from '../../../../src/knowledge/map/camera-flight';
import type { KnowledgeMap } from '../../../../src/contracts/knowledge-views';
const selection: MapSelection = {group: '', selected: '', query: '', filter: 'all', activity: false, page: 0};
const data: KnowledgeMap = {truncated: false, nodes: [
    {id: 'project', kind: 'project', title: 'CEC', detail: ''},
    ...Array.from({length: 85}, (_,i) => ({id: `note:${i}`, kind: 'technical' as const, domains: ['cms/contentstack', 'tooling'], title: `Guide ${i}`, detail: ''})),
    {id: 'attempt', kind: 'assignment', title: 'Employee attempt', detail: ''},
], edges: [{source: 'note:1', target: 'note:2', kind: 'publication', relation: 'citation'}]};

it('keeps the original real-node constellation and stable coordinates through navigation', () => {
    const overview = displayScene(data, selection), group = displayScene(data, {...selection, group: 'technical:cms'});
    expect(overview.scene.nodes.map(n=>n.id)).toEqual(data.nodes.map(n=>n.id));
    expect(overview.scene.edges).toEqual(data.edges);
    expect(overview.scene.nodes.find(n=>n.id==='attempt')?.visible).toBe(false);
    expect(group.pageNodes).toHaveLength(40); expect(group.pages).toBe(3);
    expect(group.groups.find(g=>g.id==='technical:cms')?.members).toHaveLength(85);
    expect(group.groups.find(g=>g.id==='technical:tooling')?.members).toHaveLength(85);
    const focus = displayScene(data, {...selection, selected: 'note:1'});
    expect(focus.scene.edges).toEqual(data.edges);
    expect(focus.scene.nodes.find(n=>n.id==='note:1')?.position).toEqual(overview.scene.nodes.find(n=>n.id==='note:1')?.position);
    expect(focus.scene.nodes.filter(n=>n.emphasized).map(n=>n.id)).toEqual(['note:1', 'note:2']);
    expect(data.nodes[1]).not.toHaveProperty('position');
    expect(displayScene(data, {...selection, query: 'unmatched'})).toMatchObject({browsingNodes: true, total: 0, pageNodes: []});
    expect(displayScene(data, {...selection, group: 'technical:cms', page: 999}).pageNodes).toHaveLength(5);
    expect(displayScene(data, {...selection, activity: true}).scene.nodes.find(n=>n.id==='attempt')?.visible).toBe(true);
});
it('labels a bounded collision-free subset with hover/focus priority and stable ordering', () => {
    const boxes = [{id:'ordinary',priority:2,x:20,y:20,width:80,height:10},{id:'focused',priority:0,x:30,y:20,width:80,height:10},{id:'separate',priority:2,x:20,y:70,width:80,height:10},{id:'offscreen',priority:0,x:900,y:0,width:80,height:10}];
    expect([...visibleLabels(boxes, 500, 200)]).toEqual(['focused', 'separate']);
    expect(visibleLabels([...boxes].reverse(), 500, 200)).toEqual(visibleLabels(boxes, 500, 200));
    expect(visibleLabels(boxes, 500, 200, 1).size).toBe(1); expect(visibleLabels(boxes,500,200,0).size).toBe(0);
});
it('flies from the current orbit direction to the exact stable node location', () => {
    const target = {x:10,y:20,z:30};
    expect(cameraTarget(target, {x:50,y:0,z:0},{x:0,y:0,z:0})).toEqual({position:{x:10+focusDistance,y:20,z:30},lookAt:target});
    expect(cameraTarget(target, {x:0,y:0,z:0},{x:0,y:0,z:0}).position).toEqual({x:10,y:20,z:30+focusDistance});
    expect(cameraTarget(undefined, target, target)).toEqual({position:{x:0,y:0,z:overviewDistance},lookAt:{x:0,y:0,z:0}});
});
it('interrupts a flight at the visible pose rather than jumping to the previous destination',()=>{
    const from={position:{x:0,y:0,z:300},lookAt:{x:0,y:0,z:0}},to={position:{x:80,y:40,z:100},lookAt:{x:80,y:40,z:0}};
    expect(flightPose(from,to,0,850)).toEqual(from);expect(flightPose(from,to,850,850)).toEqual(to);
    const current=flightPose(from,to,200,850);expect(current.position.x).toBeGreaterThan(0);expect(current.position.x).toBeLessThan(80);
    expect(flightPose(current,from,0,850)).toEqual(current);expect(flightPose(current,from,0,0)).toEqual(from);
});

it('eases both ends of a camera flight without overshooting its stable destination',()=>{
    const from={position:{x:0,y:0,z:300},lookAt:{x:0,y:0,z:0}},to={position:{x:100,y:0,z:100},lookAt:{x:100,y:0,z:0}};
    const start=flightPose(from,to,10,1000),end=flightPose(from,to,990,1000);
    expect(start.position.x).toBeLessThan(.01); expect(100-end.position.x).toBeLessThan(.01);
    const samples=Array.from({length:101},(_,i)=>flightPose(from,to,i*10,1000).position.x);
    expect(samples.every((x,i)=>x>=0&&x<=100&&(!i||x>=samples[i-1]))).toBe(true);
    expect(flightPose(from,to,500,1000).position.x).toBe(50);
});

it('reveals an explicitly followed connection when a type or activity filter hid its target',()=>{
    const next=selectRecord({...selection,filter:'lesson'},data.nodes.find(n=>n.id==='note:1')!);
    expect(next.filter).toBe('all');expect(displayScene(data,next).selected?.id).toBe('note:1');
    const activity=selectRecord(selection,data.nodes.find(n=>n.id==='attempt')!);
    expect(activity.activity).toBe(true);expect(displayScene(data,activity).selected?.id).toBe('attempt');
});

it('preserves group page and search context when the selected record needs no filter widening',()=>{
    const prior={...selection,group:'technical:cms',page:2},member=displayScene(data,prior).pageNodes[0];
    const next=selectRecord(prior,member);expect(next).toMatchObject({group:'technical:cms',page:2,selected:member.id});
    expect(displayScene(data,next).group?.id).toBe('technical:cms');expect(displayScene(data,{...next,selected:''}).pageNodes[0].id).toBe(member.id);
    expect(selectRecord({...selection,query:'Guide',page:1},member)).toMatchObject({query:'Guide',page:1});
});

it('reveals all loaded saved neighbors on selection without changing the filters',()=>{
    const map:KnowledgeMap={...data,edges:[...data.edges,{source:'note:1',target:'note:2',kind:'verified'},{source:'note:1',target:'attempt',kind:'supplied'}]};
    const view=displayScene(map,{...selection,selected:'note:1'});
    expect(view.neighborCount).toBe(2);expect(view.revealedCount).toBe(1);expect(view.scene.edges).toHaveLength(3);expect(view.scene.nodes.find(n=>n.id==='attempt')?.visible).toBe(true);
    expect(displayScene(map,{...selection,selected:'note:1',activity:true}).neighborCount).toBe(2);
});

it('fits every saved neighbor inside both camera axes while preserving node positions',()=>{
    const focus={x:0,y:0,z:0},neighbors=[{x:-240,y:120,z:60},{x:180,y:-140,z:-80}];
    const pose=cameraTarget(focus,{x:0,y:0,z:300},focus,neighbors,.65,50);
    const distance=Math.hypot(pose.position.x-pose.lookAt.x,pose.position.y-pose.lookAt.y,pose.position.z-pose.lookAt.z);
    const angle=Math.atan(Math.tan(25*Math.PI/180)*.65);
    for(const point of [focus,...neighbors])expect(Math.hypot(point.x-pose.lookAt.x,point.y-pose.lookAt.y,point.z-pose.lookAt.z)).toBeLessThan(distance*Math.sin(angle));
    expect(focus).toEqual({x:0,y:0,z:0});expect(neighbors[0]).toEqual({x:-240,y:120,z:60});
});
