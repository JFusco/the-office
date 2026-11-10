export interface CameraBookmark {position:[number,number,number];target:[number,number,number];zoom:number;width:number;requestedZoom:number;focus:[number,number,number]}
/** Manual orbit/zoom survives renderer disposal; a new room command still takes precedence. */
export function restoreBookmark(saved:CameraBookmark|null,focus:[number,number,number],zoom:number,width:number):CameraBookmark|null {
    if(!saved||saved.requestedZoom!==zoom||saved.focus.some((v,i)=>v!==focus[i]))return null;
    return {...saved,position:[...saved.position],target:[...saved.target],focus:[...focus],width,zoom:saved.zoom/Math.min(1,Math.max(1,saved.width)/1200)*Math.min(1,Math.max(1,width)/1200)};
}
