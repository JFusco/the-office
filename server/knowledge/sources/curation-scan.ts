import type { Store } from '../../store/store';
import { checkedReceipt, scanText, type SecretScanner } from './admission';

/** Generated excerpts and guidance cross the same scanner boundary as acquired source text. */
export async function scanCuration(store: Store, id: string, phase: 'input' | 'output', text: string, scan: SecretScanner = scanText) {
    const receipt = checkedReceipt(text, await scan(text));
    store.db.exec('CREATE TABLE IF NOT EXISTS knowledge_curation_scans(id TEXT NOT NULL,phase TEXT NOT NULL,input_sha256 TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(id,phase,input_sha256))');
    store.db.prepare('INSERT OR IGNORE INTO knowledge_curation_scans VALUES(?,?,?,?)').run(id, phase, receipt.inputSha256, JSON.stringify(receipt));
    if (!receipt.clean) throw Error(`Generated learning ${phase} secret scan blocked admission`);
    return receipt;
}
