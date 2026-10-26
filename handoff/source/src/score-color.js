// Color de la protección según la puntuación: tramos sólidos con transiciones interpoladas en OKLab.
// Rojo ≤18 · rojo→naranja 19-24 · naranja 25-43 · naranja→amarillo 44-49 · amarillo 50-68 · amarillo→verde 69-74 · verde ≥75.
const SCORE_STOPS = {
  ring: {red:"#DC2626", orange:"#F97316", yellow:"#EAB308", green:"#16A34A"},
  text: {red:"#B91C1C", orange:"#C2410C", yellow:"#A16207", green:"#15803D"}
};
const SCORE_BANDS = [[18, "red"], [25, "orange"], [43, "orange"], [50, "yellow"], [68, "yellow"], [75, "green"]];
const okLab = hex => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
  const m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
  const s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
};
const okHex = lab => {
  const l = Math.pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
  const m = Math.pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
  const s = Math.pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3);
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
  return "#" + rgb.map(v => { v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"); }).join("").toUpperCase();
};
const scoreColor = (score, kind) => {
  const P = SCORE_STOPS[kind || "ring"], v = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  if (v <= 18) return P.red;
  if (v >= 75) return P.green;
  for (let i = 0; i < SCORE_BANDS.length - 1; i++) {
    const a = SCORE_BANDS[i], b = SCORE_BANDS[i + 1];
    if (v > a[0] && v < b[0]) {
      if (a[1] === b[1]) return P[a[1]];
      const t = (v - a[0]) / (b[0] - a[0]), x = okLab(P[a[1]]), y = okLab(P[b[1]]);
      return okHex(x.map((n, k) => n + (y[k] - n) * t));
    }
    if (v === b[0]) return P[b[1]];
  }
  return P.green;
};
