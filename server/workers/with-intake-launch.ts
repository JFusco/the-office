interface LaunchCallbacks { onIntakeLaunch?:()=>void; onIntakeNotSpawned?:()=>void }

/** Every pre-spawn failure reports once; a real spawn is never refunded. */
export async function withIntakeLaunch<O extends LaunchCallbacks,T>(options:O,run:(options:O)=>Promise<T>):Promise<T> {
    let spawned=false,reported=false;
    const notSpawned=()=>{if(!spawned&&!reported){reported=true;options.onIntakeNotSpawned?.();}};
    const scoped={...options,onIntakeNotSpawned:notSpawned,onIntakeLaunch:()=>{spawned=true;options.onIntakeLaunch?.();}};
    try{return await run(scoped);}catch(error){notSpawned();throw error;}
}
