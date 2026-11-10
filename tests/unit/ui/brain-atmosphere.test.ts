import { SCENE_COLOR_TOKENS, type SceneColors } from '../../../src/tokens/scene-colors';
import { it,expect,vi } from 'vitest';
import { Scene, Points } from 'three';
import { brainAtmosphere } from '../../../src/knowledge/map/appearance';
it('keeps decorative stars outside graph data and disposes all scene additions', () => {
    vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop:()=>{}}),fillRect:()=>{}})})});
    try {
        const palette=Object.fromEntries(Object.keys(SCENE_COLOR_TOKENS).map(k=>[k,'#fff'])) as SceneColors;
        const scene=new Scene(), atmosphere=brainAtmosphere(scene,false,palette), dispose=vi.spyOn(atmosphere.texture,'dispose');
        expect(scene.children.length).toBeGreaterThan(10);
        const dust=scene.children.find(o=>o instanceof Points && o.geometry.getAttribute('position').count===3300) as Points;
        const initial=Array.from(dust.geometry.getAttribute('position').array);
        atmosphere.update(0); expect(Array.from(dust.geometry.getAttribute('position').array)).toEqual(initial);
        atmosphere.update(50); expect(Array.from(dust.geometry.getAttribute('position').array)).not.toEqual(initial);
        atmosphere.dispose(); expect(scene.children).toHaveLength(0); expect(dispose).toHaveBeenCalledOnce();
        const focused=brainAtmosphere(scene,true,palette); expect(scene.children.length).toBe(10); focused.dispose(); expect(scene.children).toHaveLength(0);
    } finally { vi.unstubAllGlobals(); }
});
