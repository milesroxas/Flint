// stable-json.ts
export function stableStringify(input: unknown): string {
  try {
    const seen = new WeakSet<object>();

    const order = (val: unknown): unknown => {
      if (val === null || typeof val !== "object") return val;
      if (seen.has(val as object)) return "[Circular]";

      seen.add(val as object);

      if (Array.isArray(val)) return val.map(order);

      const obj = val as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = order(obj[k]);
      return out;
    };

    return JSON.stringify(order(input));
  } catch {
    return JSON.stringify(input);
  }
}
