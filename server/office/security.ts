export function sanitize(value: string): string {
  return value
    .replace(/(?:Bearer\s+)[^\s"']+/gi, 'Bearer [redacted]')
    .replace(/\b(?:sk-[\w-]+|gh[oprs]_[\w]+)\b/g,'[redacted]')
    .replace(/([?&](?:token|sig|key|secret|code|access_token|client_secret|password)=)[^&\s"']+/gi,'$1[redacted]')
    .replace(/((?:password|api[_-]?key|secret|authorization|cookie|connection[_-]?string)\s*[=:]\s*)[^\n,}]+/gi,'$1[redacted]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi,'[database redacted]');
}
/** The JSON text of a value with every string in it redacted: what `sanitizeObject` parses, for a caller that only needs the text. */
export function redactedText(value: unknown): string {
  return JSON.stringify(value,(_key,item)=>typeof item==='string'?sanitize(item):item);
}
export function sanitizeObject<T>(value:T):T {
  return JSON.parse(redactedText(value));
}
export function safeOrigin(request: Request): boolean {
  const url = new URL(request.url);
  if (!['127.0.0.1','localhost'].includes(url.hostname)) return false;
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
}
export function safeWebUrl(value: string): boolean {
  try { const u=new URL(value); return u.protocol==='https:' || (u.protocol==='http:' && ['127.0.0.1','localhost'].includes(u.hostname)); } catch { return false; }
}
