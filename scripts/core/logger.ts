const tag = (code: string, label: string) => `\x1b[${code}m${label}\x1b[0m`;

export const ura = {
  log: (...args: unknown[]) => console.log(tag("36", "ura"), ...args),
  warn: (...args: unknown[]) => console.warn(tag("33", "warn"), ...args),
  error: (...args: unknown[]) => console.error(tag("31", "error"), ...args),
  print: (...args: unknown[]) => console.log(...args),
};
