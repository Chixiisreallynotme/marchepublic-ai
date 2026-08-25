type Level = "info" | "warn" | "error";

function emit(level: Level, scope: string, message: string, meta?: unknown) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...(meta !== undefined ? { meta: meta instanceof Error ? { name: meta.name, message: meta.message } : meta } : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (scope: string, message: string, meta?: unknown) => emit("info", scope, message, meta),
  warn: (scope: string, message: string, meta?: unknown) => emit("warn", scope, message, meta),
  error: (scope: string, message: string, meta?: unknown) => emit("error", scope, message, meta),
};
