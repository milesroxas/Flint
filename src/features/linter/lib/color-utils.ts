/**
 * Converts various color formats to hex format for display purposes.
 * This is a simplified conversion that handles common cases.
 */

function channelsToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const rr = clamp(r);
  const gg = clamp(g);
  const bb = clamp(b);
  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}

function parseRgbLikeToHex(colorValue: string): string | null {
  const m = colorValue.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/i);
  if (!m) return null;
  return channelsToHex(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

/** `h` in degrees (0–360), `s` and `l` as 0–100 (CSS percentages). */
function hslToRgbChannels(h: number, s: number, l: number): [number, number, number] {
  const ss = s / 100;
  const ll = l / 100;
  if (ss === 0) {
    const v = ll * 255;
    return [v, v, v];
  }
  const hh = ((h % 360) + 360) % 360;
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hr = hh / 360;
  const r = hueToRgb(p, q, hr + 1 / 3) * 255;
  const g = hueToRgb(p, q, hr) * 255;
  const b = hueToRgb(p, q, hr - 1 / 3) * 255;
  return [r, g, b];
}

function parseHslLikeToHex(colorValue: string): string | null {
  const m = colorValue.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+)\s*)?\)$/i);
  if (!m) return null;
  const [r, g, b] = hslToRgbChannels(parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]));
  return channelsToHex(r, g, b);
}

export const convertColorToHex = (colorValue: string): string => {
  if (colorValue.startsWith("#")) {
    return colorValue;
  }

  if (/^[a-z]+$/i.test(colorValue)) {
    return colorValue;
  }

  const fromRgb = parseRgbLikeToHex(colorValue);
  if (fromRgb) return fromRgb;

  const fromHsl = parseHslLikeToHex(colorValue);
  if (fromHsl) return fromHsl;

  return colorValue;
};
