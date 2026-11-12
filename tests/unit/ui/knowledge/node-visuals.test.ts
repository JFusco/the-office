import {it,expect,vi} from 'vitest';
import {PerspectiveCamera,SpriteMaterial,Raycaster,Vector3} from 'three';
import {nodeVisuals} from '../../../../src/knowledge/map/node-visuals';
import {SCENE_COLOR_TOKENS,type SceneColors} from '../../../../src/tokens/scene-colors';

it('keeps landmark labels sparse, labels individual nodes on interaction and releases visual resources',()=>{
    vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop:()=>{}}),fillRect:()=>{},fillText:()=>{},measureText:(t:string)=>({width:t.length*16}),beginPath:()=>{},arc:()=>{},fill:()=>{}})})});
    try{
        const palette=Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(k=>[k,'#fff'])) as SceneColors;
        const visuals=nodeVisuals(palette), camera=new PerspectiveCamera(50,2,.1,1000);camera.position.z=300;camera.lookAt(0,0,0);
        const nodes=Array.from({length:20},(_,i)=>({id:`n${i}`,title:`Guide ${i}`,kind:i===0?'project' as const:'technical' as const,technicalKind:i===10||i===19?'index':undefined,detail:'',visible:true,emphasized:true,position:{x:i===10?-150:i===19?150:i*5,y:0,z:0}}));
        const groups=nodes.map(node=>visuals.create(node));
        const overview={data:{nodes,edges:[],truncated:false},reduced:true};
        const container={clientWidth:1200,clientHeight:800} as HTMLElement;
        visuals.update(overview,camera,container,16);
        expect(groups.filter(g=>g.children[1].visible)).toEqual([groups[0],groups[10],groups[19]]);
        visuals.hover('n4');visuals.update(overview,camera,container,16);
        expect(groups[4].children[1].visible).toBe(true);expect(groups[0].children[1].visible).toBe(false);
        expect(groups.filter((g,i)=>![0,4,10,19].includes(i)&&g.children[1].visible)).toHaveLength(0);
        visuals.hover('');visuals.update(overview,camera,container,16);
        expect(groups.filter(g=>g.children[1].visible)).toEqual([groups[0],groups[10],groups[19]]);
        visuals.update({...overview,highlightId:'n8'},camera,container,16);
        expect(groups[8].children[1].visible).toBe(true);
        nodes.forEach((node,i)=>{node.emphasized=i<2;}); // Selected node and a connected neighbor.
        visuals.update({data:{nodes,edges:[],truncated:false},reduced:true,focusId:'n0'},camera,{clientWidth:1200,clientHeight:800} as HTMLElement,16);
        expect(groups.filter(g=>g.children[1].visible)).toHaveLength(1);
        expect(groups[0].children[1].visible).toBe(false);expect(groups[1].children[1].visible).toBe(true);
        expect((groups[0].children[0] as any).material.opacity).toBeCloseTo(1);expect((groups[2].children[0] as any).material.opacity).toBeCloseTo(.32);
        visuals.hover('n1');visuals.update({...overview,focusId:'n0'},camera,container,16);
        expect(groups[1].children[1].visible).toBe(true);expect(groups[0].children[1].visible).toBe(false);
        visuals.hover('');visuals.update({...overview,focusId:'n0'},camera,container,16);
        expect(groups[0].children[1].visible).toBe(false);expect(groups[1].children[1].visible).toBe(true);
        groups[0].updateMatrixWorld(true);
        const ray=new Raycaster(new Vector3(0,groups[0].children[1].position.y,300),new Vector3(0,0,-1));ray.camera=camera;
        expect(ray.intersectObject(groups[0],true)).toEqual([]);
        expect(visuals.hit('n0',ray)).toBe(false);
        ray.ray.origin.y=0;expect(visuals.hit('n0',ray)).toBe(true);expect(visuals.pick(ray)?.id).toBe('n0');expect(ray.intersectObject(groups[0],true).map(hit=>hit.object)).toEqual([groups[0].children[0]]);
        const material=(groups[0].children[0] as any).material as SpriteMaterial,dispose=vi.spyOn(material,'dispose');
        visuals.retain(new Set(['n1']));expect(dispose).toHaveBeenCalledOnce();visuals.dispose();expect(dispose).toHaveBeenCalledOnce();
    }finally{vi.unstubAllGlobals();}
});

it('fits long labels by measured width and keeps the full source title unchanged',()=>{
    const drawn=vi.fn();vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop:()=>{}}),fillRect:()=>{},fillText:drawn,measureText:(t:string)=>({width:t.length*16}),beginPath:()=>{},arc:()=>{},fill:()=>{}})})});
    try{
        const palette=Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(k=>[k,'#fff'])) as SceneColors;
        const visuals=nodeVisuals(palette),node={id:'long',title:'Accessibility review for confirmation dialogs',kind:'technical' as const,detail:'',visible:true,emphasized:true,position:{x:0,y:0,z:0}};
        visuals.create(node);const caption=drawn.mock.calls[0][0] as string;expect(caption.length*16).toBeLessThanOrEqual(616);expect(caption.endsWith('…')).toBe(true);expect(node.title).toBe('Accessibility review for confirmation dialogs');visuals.dispose();
    }finally{vi.unstubAllGlobals();}
});
