export type Debugger = {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
};

export const createDebugger = (namespace?: string): Debugger => {
  let enabled = process.env.NODE_ENV === "development";

  const prefix = namespace ? `[${namespace}]` : "";

  const wrap =
    (fn: (...args: unknown[]) => void) =>
    (...args: unknown[]) => {
      if (enabled) fn(prefix, ...args);
    };

  return {
    log: wrap(console.log),
    warn: wrap(console.warn),
    error: wrap(console.error),
    enable: () => {
      enabled = true;
    },
    disable: () => {
      enabled = false;
    },
    isEnabled: () => enabled,
  };
};
