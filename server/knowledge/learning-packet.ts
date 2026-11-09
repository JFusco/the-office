import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../store/store';
import type { PendingRetrospective } from '../../src/shared';
import type { RetrospectivePacket } from './retrospective-facts';
import { learningDigest } from './learning-events';
/** Digest-bound immutable accepted evidence. Missing or altered saved proof never gets regenerated. */
export function freezeLearningPacket(store: Store, pending: PendingRetrospective, folder: string, build: () => RetrospectivePacket): RetrospectivePacket {
    const path = resolve(folder, 'facts.json');
    if (pending.packetDigest) {
        if (!existsSync(path) || statSync(path).size > 65536) throw new Error('Frozen learning proof unavailable');
        const packet = JSON.parse(readFileSync(path, 'utf8')) as RetrospectivePacket;
        if (learningDigest(packet) !== pending.packetDigest) throw new Error('Frozen learning proof changed');
        return packet;
    }
    // A file without its store-owned binding is not accepted proof, including an interrupted legacy write.
    if (existsSync(path)) throw new Error('Unbound learning packet requires reconciliation');
    const packet = build(), text = JSON.stringify(packet);
    if (text.length > 24000 || Buffer.byteLength(text) > 65536) throw new Error('Learning packet exceeds its evidence budget');
    pending.packetDigest = learningDigest(packet); store.save();
    writeFileSync(path, text, { flag: 'wx', mode: 0o600 });
    return packet;
}
