import {it,expect,vi} from 'vitest';
import {Texture,PerspectiveCamera,SpriteMaterial} from 'three';
import {nodeVisuals} from '../../../../src/knowledge/map/node-visuals';
import {SCENE_COLOR_TOKENS,type SceneColors} from '../../../../src/tokens/scene-colors';

it('bounds visible labels, fades irrelevant stars and disposes removed visual resources',()=>{
    vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillText:()=>{},beginPath:()=>{},arc:()=>{},fill:()=>{}})})});
    try{
        const palette=Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(k=>[k,'#fff'])) as SceneColors;
        const visuals=nodeVisuals(palette), camera=new PerspectiveCamera(50,2,.1,1000);camera.position.z=300;camera.lookAt(0,0,0);
        const nodes=Array.from({length:20},(_,i)=>({id:`n${i}`,title:`Guide ${i}`,kind:'technical' as const,detail:'',visible:true,emphasized:i===0,position:{x:i*5,y:0,z:0}}));
        const groups=nodes.map(node=>visuals.create(node));
        visuals.update({data:{nodes,edges:[],truncated:false},reduced:true,focusId:'n0'},camera,{clientWidth:1200,clientHeight:800} as HTMLElement,16);
        expect(groups.filter(g=>g.children[1].visible)).toHaveLength(1);
        expect((groups[0].children[0] as any).material.opacity).toBeCloseTo(.95);expect((groups[1].children[0] as any).material.opacity).toBeCloseTo(.18);
        const material=(groups[0].children[0] as any).material as SpriteMaterial,dispose=vi.spyOn(material,'dispose');
        visuals.retain(new Set(['n1']));expect(dispose).toHaveBeenCalledOnce();visuals.dispose();expect(dispose).toHaveBeenCalledOnce();
    }finally{vi.unstubAllGlobals();}
});
