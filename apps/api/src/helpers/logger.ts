const timestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${timestamp()} - ${message}`, meta ?? '');
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${timestamp()} - ${message}`, meta ?? '');
  },
  error: (message: string, error?: unknown) => {
    console.error(
      `[ERROR] ${timestamp()} - ${message}`,
      error instanceof Error ? error.stack || error.message : error,
    );
  },
};
