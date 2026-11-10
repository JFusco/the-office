import {it,expect,vi} from 'vitest';
import {PerspectiveCamera,SpriteMaterial,Raycaster,Vector3} from 'three';
import {nodeVisuals} from '../../../../src/knowledge/map/node-visuals';
import {SCENE_COLOR_TOKENS,type SceneColors} from '../../../../src/tokens/scene-colors';

it('bounds visible labels, fades irrelevant stars and disposes removed visual resources',()=>{
    vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText:()=>{},measureText:(t:string)=>({width:t.length*16}),beginPath:()=>{},arc:()=>{},fill:()=>{}})})});
    try{
        const palette=Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(k=>[k,'#fff'])) as SceneColors;
        const visuals=nodeVisuals(palette), camera=new PerspectiveCamera(50,2,.1,1000);camera.position.z=300;camera.lookAt(0,0,0);
        const nodes=Array.from({length:20},(_,i)=>({id:`n${i}`,title:`Guide ${i}`,kind:'technical' as const,detail:'',visible:true,emphasized:i===0,position:{x:i*5,y:0,z:0}}));
        const groups=nodes.map(node=>visuals.create(node));
        visuals.update({data:{nodes,edges:[],truncated:false},reduced:true,focusId:'n0'},camera,{clientWidth:1200,clientHeight:800} as HTMLElement,16);
        expect(groups.filter(g=>g.children[1].visible)).toHaveLength(1);
        expect((groups[0].children[0] as any).material.opacity).toBeCloseTo(.95);expect((groups[1].children[0] as any).material.opacity).toBeCloseTo(.18);
        groups[0].updateMatrixWorld(true);
        const ray=new Raycaster(new Vector3(0,groups[0].children[1].position.y,300),new Vector3(0,0,-1));ray.camera=camera;
        expect(ray.intersectObject(groups[0],true)).toEqual([]);
        ray.ray.origin.y=0;expect(ray.intersectObject(groups[0],true).map(hit=>hit.object)).toEqual([groups[0].children[0]]);
        const material=(groups[0].children[0] as any).material as SpriteMaterial,dispose=vi.spyOn(material,'dispose');
        visuals.retain(new Set(['n1']));expect(dispose).toHaveBeenCalledOnce();visuals.dispose();expect(dispose).toHaveBeenCalledOnce();
    }finally{vi.unstubAllGlobals();}
});

it('fits long labels by measured width and keeps the full source title unchanged',()=>{
    const drawn=vi.fn();vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText:drawn,measureText:(t:string)=>({width:t.length*16}),beginPath:()=>{},arc:()=>{},fill:()=>{}})})});
    try{
        const palette=Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(k=>[k,'#fff'])) as SceneColors;
        const visuals=nodeVisuals(palette),node={id:'long',title:'Accessibility review for confirmation dialogs',kind:'technical' as const,detail:'',visible:true,emphasized:true,position:{x:0,y:0,z:0}};
        visuals.create(node);const caption=drawn.mock.calls[0][0] as string;expect(caption.length*16).toBeLessThanOrEqual(616);expect(caption.endsWith('…')).toBe(true);expect(node.title).toBe('Accessibility review for confirmation dialogs');visuals.dispose();
    }finally{vi.unstubAllGlobals();}
});
