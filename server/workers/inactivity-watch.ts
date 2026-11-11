/** A worker may run while it produces output. Silence triggers the existing stop path. */
export function inactivityWatch(milliseconds: number | undefined, stop: () => void) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => { if (timer) clearTimeout(timer); };
    const progress = () => {
        clear();
        if (milliseconds && milliseconds > 0) timer = setTimeout(stop, milliseconds);
    };
    progress();
    return { progress, clear };
}
