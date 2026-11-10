import { test,expect } from 'vitest';
import { restoreBookmark,type CameraBookmark } from '../../../src/scene/camera-bookmark';
const saved:CameraBookmark={position:[10,20,30],target:[1,2,3],zoom:72,width:1440,requestedZoom:43,focus:[0,0,0]};
test('restores manual camera state without changing the bookmark and scales only for the viewport',()=>{const result=restoreBookmark(saved,[0,0,0],43,600)!;expect(result.position).toEqual([10,20,30]);expect(result.target).toEqual([1,2,3]);expect(result.zoom).toBe(36);expect(saved.zoom).toBe(72);expect(result.position).not.toBe(saved.position);});
test('a new room focus or zoom command supersedes the retained manual view',()=>{expect(restoreBookmark(saved,[1,0,0],43,1440)).toBeNull();expect(restoreBookmark(saved,[0,0,0],50,1440)).toBeNull();expect(restoreBookmark(null,[0,0,0],43,1440)).toBeNull();});
