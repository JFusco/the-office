import { z } from 'zod';
import { sanitizeObject } from '../office/security';

/** A complete result may have one presentation fence. Never guess fields or salvage fragments. */
export function parseWorkerResult<T>(payload: unknown, schema: z.ZodType<T>, text = false): { result: T; normalization: 'single-json-fence' | null } {
    let normalization: 'single-json-fence' | null = null;
    if (text) {
        if (typeof payload !== 'string') throw new Error('Worker JSON response is missing');
        const match = /^\s*```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/i.exec(payload);
        if (match) { payload = match[1]; normalization = 'single-json-fence'; }
        payload = JSON.parse(payload as string);
    }
    return { result: schema.parse(sanitizeObject(payload)), normalization };
}
