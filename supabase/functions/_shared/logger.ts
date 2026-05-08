// Structured logger with request id for edge functions.
// Usage: const log = createLogger('fn-name', req); log.info('msg', { extra });
type Level = 'debug' | 'info' | 'warn' | 'error';

export function createLogger(fn: string, req?: Request) {
  const requestId =
    req?.headers.get('x-request-id') ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2));
  const base = { fn, request_id: requestId };
  const emit = (level: Level, msg: string, extra?: Record<string, unknown>) => {
    const entry = { ts: new Date().toISOString(), level, msg, ...base, ...(extra ?? {}) };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };
  return {
    requestId,
    debug: (m: string, e?: Record<string, unknown>) => emit('debug', m, e),
    info: (m: string, e?: Record<string, unknown>) => emit('info', m, e),
    warn: (m: string, e?: Record<string, unknown>) => emit('warn', m, e),
    error: (m: string, e?: Record<string, unknown>) => emit('error', m, e),
  };
}
