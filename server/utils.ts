export const logger = {
  info: (msg: string) => {
    // lightweight wrapper so other modules can call logger.info
    // keep output consistent with vite.log
    // eslint-disable-next-line no-console
    console.log(`[info] ${msg}`);
  },
  error: (msg: string, err?: unknown) => {
    // eslint-disable-next-line no-console
    console.error(`[error] ${msg}`, err ?? '');
  },
  warn: (msg: string) => {
    // eslint-disable-next-line no-console
    console.warn(`[warn] ${msg}`);
  },
};
