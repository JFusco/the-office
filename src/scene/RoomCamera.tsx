import { useLayoutEffect,useRef,type RefObject } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { OrthographicCamera } from 'three';
import { restoreBookmark,type CameraBookmark } from './camera-bookmark';
export function RoomCamera({focus,zoom,bookmark}:{focus:[number,number,number];zoom:number;bookmark?:RefObject<CameraBookmark|null>}) {
    const controls=useRef<OrbitControlsImpl>(null),ready=useRef(false),{camera,invalidate,size}=useThree();
    const capture=()=>{if(ready.current&&bookmark&&controls.current&&camera instanceof OrthographicCamera)bookmark.current={position:camera.position.toArray(),target:controls.current.target.toArray(),zoom:camera.zoom,width:size.width,requestedZoom:zoom,focus:[...focus]};};
    useLayoutEffect(()=>{
        const orbit=controls.current;if(!orbit||!(camera instanceof OrthographicCamera))return;
        const saved=restoreBookmark(bookmark?.current||null,focus,zoom,size.width);
        if(saved){camera.position.set(...saved.position);orbit.target.set(...saved.target);camera.zoom=saved.zoom;}
        else {orbit.target.set(...focus);camera.zoom=zoom*Math.min(1,size.width/1200);}
        camera.updateProjectionMatrix();orbit.update();ready.current=true;invalidate();
        return ()=>{capture();ready.current=false;};
    },[focus,zoom,size.width,camera,invalidate,bookmark]);
    return <OrbitControls ref={controls} onChange={capture} makeDefault enableDamping maxPolarAngle={Math.PI*.44} minPolarAngle={Math.PI*.12} minZoom={8} maxZoom={100} maxDistance={60} minDistance={10}/>;
}
