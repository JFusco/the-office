import { open } from 'node:fs/promises';
import { providerAsset } from './github-evidence';
import { CommandFailure } from '../../workers/process';
/** Provider assets are fetched without cookies or authorization, including redirects. */
export function assetDownloader(fetchAsset:typeof fetch=fetch) {
 return async(url:string,path:string,signal:AbortSignal,maxBytes:number)=>{
  if(!providerAsset(url))throw new Error('Unsupported provider asset origin');
  let response:Response|undefined;
  for(let hops=0;hops<4;hops++){
   response=await fetchAsset(url,{signal,redirect:'manual',credentials:'omit'});
   if(response.status>=300&&response.status<400){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw new Error('Asset redirect has no target');url=new URL(location,url).href;if(!providerAsset(url))throw new Error('Unsupported asset redirect');continue;}
   break;
  }
  if(!response?.ok||!response.body)throw new CommandFailure('Provider asset unavailable',response?.status===401||response?.status===403?'permission':'transient-read',false);
  if(Number(response.headers.get('content-length'))>maxBytes){await response.body.cancel();throw new Error('Attachment exceeds byte limit');}
  const file=await open(path,'wx',0o600);let total=0;const reader=response.body.getReader();
  try{for(;;){const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.byteLength;if(total>maxBytes){await reader.cancel();throw new Error('Attachment exceeds byte limit');}await file.write(chunk.value);}}
  finally{await reader.cancel().catch(()=>{});await file.close();}
 };
}
