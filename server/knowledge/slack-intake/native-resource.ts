import { digest } from './config';
import type { ReadTask } from './contracts';
/** Native file references are metadata, not proof that a binary body was decoded. */
export function nativeFile(data: any, task: ReadTask): any {
    if (data?.file_id !== task.resource || typeof data.metadata_text !== 'string' || typeof data.mime_type !== 'string') throw Error('native-file-identity');
    const size = /^Size: (\d+(?:\.\d+)?) (B|KB|MB)$/m.exec(data.metadata_text);
    if (!size) throw Error('native-file-size');
    const bytes = Number(size[1]) * ({ B: 1, KB: 1000, MB: 1000000 }[size[2]] || 0);
    if (bytes > 10000000) throw Error('native-file-too-large');
    const text = data.text_content;
    if (text !== null && typeof text !== 'string') throw Error('native-file-content');
    // Expiring download URLs and transport attachment IDs never become resource identity.
    return { id: task.resource, text: text || '', size: bytes, version: digest(text === null ? data.metadata_text : text),
        format: 'slack-text-v1', ...(text === null ? { unavailable: 'binary-body-unread' } : {}) };
}
