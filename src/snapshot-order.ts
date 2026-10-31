import type { OfficeSnapshot } from './shared';
export class SnapshotAcceptance {
    instance = '';
    sequence = -1;
    private retired = new Set<string>();
    accept(snapshot: OfficeSnapshot, synchronized: boolean): boolean {
        const instance = snapshot.serviceInstanceId, sequence = snapshot.snapshotSequence;
        if (!instance || !Number.isSafeInteger(sequence) || sequence! < 0 || !Number.isFinite(Date.parse(snapshot.serverTime)))
            return false;
        if (this.retired.has(instance))
            return false;
        if (this.instance && instance !== this.instance) {
            if (!synchronized)
                return false;
            this.retired.add(this.instance);
            this.sequence = -1;
        }
        if (instance === this.instance && sequence! <= this.sequence)
            return false;
        this.instance = instance;
        this.sequence = sequence!;
        return true;
    }
}
