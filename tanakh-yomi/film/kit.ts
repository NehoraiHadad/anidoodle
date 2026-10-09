// TANAKH-YOMI KIT. Shared motion vocabulary for the daily film: easing, the narration clock,
// parchment, painted plates, Hebrew type with niqqud, kinetic captions, chips and grain.
// Everything here is a pure function of (t, env): no clock, randomness only from rng(seed).
import { rng, fractal, type Ctx, type Env } from "../../engine/src/canvas-core/core";

export const W = 1080, H = 1920, FPS = 30;
export const C = {
  ink: "#0d0b09", night: "#121820", parch: "#1c1610", parchHi: "#2a2117",
  gold: "#e3b55b", goldHi: "#f8e2a0", goldLo: "#9c7633", cream: "#f3e9d6", ember: "#ff9a4a", blood: "#d0563c", sea: "#16222c", seaHi: "#25384a",
};
export const FONT = { verse: '"Frank Ruhl Libre"', ui: '"Heebo"' };

// ---------------------------------------------------------------- maths
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a)); // 0..1 over [a,b]
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const eout = (x: number) => 1 - (1 - x) ** 3;
export const ein = (x: number) => x * x * x;
export const eback = (x: number) => { const c = 1.70158, d = x - 1; return 1 + (c + 1) * d * d * d + c * d * d; };
/** visible window: ramps up over `fi` after a, down over `fo` before b */
export const vis = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) => Math.min(eio(prog(t, a, a + fi)), 1 - eio(prog(t, b - fo, b)));
export const pulse = (t: number, at: number, len = 0.6) => { const x = (t - at) / len; return x < 0 || x > 1 ? 0 : Math.sin(Math.PI * x) ** 2; };

// ---------------------------------------------------------------- narration clock
export type Word = { w: string; t0: number; t1: number; scene: string };
export type Timing = { duration: number; scenes: { id: string; start: number; end: number; speechStart: number; speechEnd: number }[]; words: Word[] };
export const plain = (s: string) => s.replace(/[֑-ׇ]/g, "").replace(/[.,:;?!"״׳…־]+/g, " ").trim();
export const clock = (T: Timing) => {
  const scene = (id: string) => { const s = T.scenes.find((x) => x.id === id); if (!s) throw new Error(`no scene ${id}`); return s; };
  /** time the n-th word of scene `id` containing `m` (niqqud-insensitive) starts. Throws if absent: a cue must exist. */
  const word = (id: string, m: string, n = 0) => { const ws = T.words.filter((w) => w.scene === id && plain(w.w).includes(plain(m))); if (!ws[n]) throw new Error(`cue '${m}'#${n} not in scene ${id}`); return ws[n]; };
  return { scene, at: (id: string, m: string, n = 0) => word(id, m, n).t0, end: (id: string, m: string, n = 0) => word(id, m, n).t1, word };
};

// ---------------------------------------------------------------- surfaces
const cached = <T>(env: Env, key: string, make: () => T): T => { let v = env.cache.get(key) as T | undefined; if (!v) { v = make(); env.cache.set(key, v); } return v; };
/** warm dark parchment: two octaves of fibre plus blotches, rendered once at half size */
export const parchment = (ctx: Ctx, env: Env, t: number, tint = 1) => {
  const tile = cached(env, "parch", () => {
    const w = 540, h = 960, L = env.canvas(w, h), img = L.ctx.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = fractal(7, x, y, 0.012, 0.012, 4), f = fractal(9, x, y, 0.25, 0.02, 2), b = fractal(3, x, y, 0.004, 0.004, 3);
      const v = 0.55 + 0.5 * (n - 0.5) + 0.18 * (f - 0.5) - 0.35 * Math.max(0, b - 0.55), i = (y * w + x) * 4;
      d[i] = 28 * v + 6; d[i + 1] = 22 * v + 4; d[i + 2] = 15 * v + 3; d[i + 3] = 255;
    }
    L.ctx.putImageData(img, 0, 0); return L;
  });
  ctx.save(); ctx.globalAlpha = tint; const dx = Math.sin(t * 0.05) * 12, dy = Math.cos(t * 0.04) * 10;
  ctx.drawImage(tile.canvas, -20 + dx, -20 + dy, W + 40, H + 40); ctx.restore();
};
/** moving film grain + vignette: something changes every frame, gently */
export const grain = (ctx: Ctx, env: Env, frame: number, amt = 0.06) => {
  const tile = cached(env, "grain", () => { const s = 256, L = env.canvas(s, s), img = L.ctx.createImageData(s, s), r = rng(77); for (let i = 0; i < s * s; i++) { const v = r() * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; } L.ctx.putImageData(img, 0, 0); return L; });
  const r = rng(1000 + frame); ctx.save(); ctx.globalAlpha = amt; ctx.globalCompositeOperation = "overlay";
  const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(tile.canvas, x, y);
  ctx.restore();
};
export const vignette = (ctx: Ctx, k = 0.75) => {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.22, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
};
/** bottom/top darkening so type always reads over a painting */
export const scrim = (ctx: Ctx, y0: number, y1: number, a: number) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "rgba(8,6,4,0)"); g.addColorStop(1, `rgba(8,6,4,${a})`); ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); };

// ---------------------------------------------------------------- painted plates
export type KB = { x0: number; y0: number; s0: number; x1: number; y1: number; s1: number }; // focus in image fractions, zoom
/** cover-fit an image, then Ken Burns from (x0,y0,s0) to (x1,y1,s1) over p (eased by caller) */
export const plate = (ctx: Ctx, env: Env, name: string, p: number, kb: KB, alpha = 1, sway = 0) => {
  const img = env.image?.(name) as (CanvasImageSource & { width: number; height: number }) | undefined; if (!img || alpha <= 0) return;
  const base = Math.max(W / img.width, H / img.height), s = base * lerp(kb.s0, kb.s1, p);
  const fx = lerp(kb.x0, kb.x1, p) * img.width, fy = lerp(kb.y0, kb.y1, p) * img.height, w = img.width * s, h = img.height * s;
  // the focus point drifts toward screen centre, clamped so the frame is always covered
  let x = W / 2 - fx * s + sway, y = H / 2 - fy * s; x = Math.min(0, Math.max(W - w, x)); y = Math.min(0, Math.max(H - h, y));
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(img, x, y, w, h); ctx.restore();
};
/** dust motes drifting through a light shaft */
export const motes = (ctx: Ctx, t: number, seed: number, n: number, alpha: number, box = { x: 0, y: 0, w: W, h: H }, color = "255,226,160") => {
  if (alpha <= 0) return; const r = rng(seed); ctx.save(); const base = ctx.globalAlpha;
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), sp = 0.15 + r() * 0.5, sz = 1 + r() * 2.8, ph = r() * 6.28;
    const x = box.x + ((bx * box.w + Math.sin(t * 0.3 + ph) * 30 + t * 8 * sp) % box.w), y = box.y + (((by * box.h - t * 14 * sp) % box.h) + box.h) % box.h;
    ctx.globalAlpha = base * alpha * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + ph))); ctx.fillStyle = `rgb(${color})`; ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.283); ctx.fill();
  }
  ctx.restore();
};

// ---------------------------------------------------------------- type
export const font = (px: number, w = 700, fam = FONT.ui) => `${w} ${px}px ${fam}`;
export const txt = (ctx: Ctx, s: string, x: number, y: number, px: number, color: string, o: { w?: number; fam?: string; align?: CanvasTextAlign; alpha?: number; glow?: number; glowColor?: string; stroke?: string; strokeW?: number } = {}) => {
  if ((o.alpha ?? 1) <= 0) return;
  ctx.save(); ctx.direction = "rtl"; ctx.font = font(px, o.w ?? 700, o.fam ?? FONT.ui); ctx.textAlign = o.align ?? "center"; ctx.textBaseline = "alphabetic"; ctx.globalAlpha *= o.alpha ?? 1;
  if (o.stroke) { ctx.lineJoin = "round"; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW ?? 8; ctx.strokeText(s, x, y); }
  if (o.glow) { ctx.shadowColor = o.glowColor ?? "rgba(255,200,110,0.85)"; ctx.shadowBlur = o.glow; }
  ctx.fillStyle = color; ctx.fillText(s, x, y); ctx.restore();
};
export const measure = (ctx: Ctx, s: string, px: number, w = 700, fam = FONT.ui) => { ctx.save(); ctx.direction = "rtl"; ctx.font = font(px, w, fam); const m = ctx.measureText(s).width; ctx.restore(); return m; };
/** gold leaf fill: a vertical gradient with a moving sheen */
export const goldFill = (ctx: Ctx, y: number, px: number, t: number) => {
  const g = ctx.createLinearGradient(0, y - px, 0, y + px * 0.3), s = 0.5 + 0.5 * Math.sin(t * 1.3);
  g.addColorStop(0, C.goldHi); g.addColorStop(0.45 + 0.1 * s, C.gold); g.addColorStop(1, C.goldLo); return g;
};

/** A verse line revealed word by word, in sync with the narrator speaking those words.
 *  words: displayed words (with niqqud), times: when each appears. Right-to-left layout, centred on cx. */
export type VerseOpts = { px?: number; w?: number; color?: string | CanvasGradient; alpha?: number; rise?: number; glow?: number; hi?: Record<number, number> };
export const verseLine = (ctx: Ctx, words: string[], times: number[], t: number, cx: number, y: number, o: VerseOpts = {}) => {
  const px = o.px ?? 86, wt = o.w ?? 700, gap = px * 0.28; ctx.save(); ctx.direction = "rtl"; ctx.font = font(px, wt, FONT.verse); ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
  const ws = words.map((s) => ctx.measureText(s).width), total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = cx + total / 2; const base = ctx.globalAlpha;
  words.forEach((s, i) => {
    const a = eout(prog(t, times[i], times[i] + 0.45)) * (o.alpha ?? 1), hi = o.hi?.[i] ?? 0;
    if (a > 0) {
      const dy = (1 - a) * (o.rise ?? 26);
      ctx.globalAlpha = base * a; ctx.shadowColor = `rgba(255,190,90,${0.55 + 0.45 * hi})`; ctx.shadowBlur = (o.glow ?? 18) + 40 * hi;
      ctx.fillStyle = hi > 0.01 ? C.goldHi : (o.color ?? C.gold); ctx.fillText(s, x, y + dy);
    }
    x -= ws[i] + gap;
  });
  ctx.restore(); return total;
};

// ---------------------------------------------------------------- captions
export type Caption = { words: Word[]; t0: number; t1: number; text: string };
/** phrase-sized captions: break on punctuation, at most 4 words / ~24 letters */
export const captions = (T: Timing): Caption[] => {
  const out: Caption[] = []; let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ words: cur, t0: cur[0].t0, t1: cur.at(-1)!.t1, text: cur.map((w) => plain(w.w)).join(" ") }); cur = []; };
  T.words.forEach((w, i) => {
    const next = T.words[i + 1]; cur.push(w);
    const len = cur.map((x) => plain(x.w)).join(" ").length;
    if (/[.,:?!…]$/.test(w.w) || cur.length >= 4 || len > 22 || !next || next.scene !== w.scene || next.t0 - w.t1 > 0.45) flush();
  });
  out.forEach((c, i) => { const n = out[i + 1]; c.t1 = n ? Math.min(c.t1 + 0.6, n.t0 - 0.02) : c.t1 + 0.8; });
  return out;
};
export const drawCaption = (ctx: Ctx, caps: Caption[], t: number, y: number, hide: (t: number) => boolean) => {
  const c = caps.find((k) => t >= k.t0 - 0.08 && t < k.t1); if (!c || hide(t)) return;
  const a = Math.min(eout(prog(t, c.t0 - 0.08, c.t0 + 0.12)), 1 - prog(t, c.t1 - 0.12, c.t1)), px = 62, gap = 18;
  ctx.save(); ctx.direction = "rtl"; ctx.font = font(px, 800); ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
  const ws = c.words.map((w) => ctx.measureText(plain(w.w)).width), total = ws.reduce((p, q) => p + q, 0) + gap * (ws.length - 1);
  let x = W / 2 + total / 2; const lift = (1 - a) * 14;
  c.words.forEach((w, i) => {
    const s = plain(w.w), on = t >= w.t0 - 0.03, now = on && t < w.t1 + 0.05;
    ctx.globalAlpha = a * (on ? 1 : 0.55); ctx.lineJoin = "round"; ctx.lineWidth = 10; ctx.strokeStyle = "rgba(10,7,4,0.85)"; ctx.strokeText(s, x, y + lift);
    ctx.shadowColor = "rgba(255,190,90,0.7)"; ctx.shadowBlur = now ? 22 : 0; ctx.fillStyle = now ? C.goldHi : C.cream; ctx.fillText(s, x, y + lift); ctx.shadowBlur = 0;
    x -= ws[i] + gap;
  });
  ctx.restore();
};

// ---------------------------------------------------------------- chrome
/** a credit chip: rounded gold-edged plate with a name and a small source line */
export const chip = (ctx: Ctx, name: string, sub: string, x: number, y: number, a: number) => {
  if (a <= 0) return; const px = 44, w = Math.max(measure(ctx, name, px, 800), measure(ctx, sub, 28, 500)) + 80, h = 120, k = eback(clamp(a));
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = "rgba(14,11,8,0.82)"; ctx.strokeStyle = C.gold; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18); ctx.fill(); ctx.stroke();
  txt(ctx, name, 0, -4, px, C.goldHi, { w: 800 }); txt(ctx, sub, 0, 38, 28, C.cream, { w: 500, alpha: 0.85 }); ctx.restore();
};
export const header = (ctx: Ctx, chapter: string, a: number) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
  txt(ctx, "התנ״ך היומי", W / 2, 96, 34, C.gold, { w: 600, stroke: "rgba(0,0,0,0.6)", strokeW: 6 });
  ctx.strokeStyle = C.goldLo; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - 150, 116); ctx.lineTo(W / 2 + 150, 116); ctx.stroke();
  txt(ctx, chapter, W / 2, 156, 30, C.cream, { w: 500, alpha: 0.9, stroke: "rgba(0,0,0,0.6)", strokeW: 6 }); ctx.restore();
};
/** a stroke drawn progressively along a polyline (p: 0..1), ink glow under a bright core */
export const strokeAlong = (ctx: Ctx, pts: [number, number][], p: number, color: string, width: number, glow = 0, closed = false) => {
  if (p <= 0 || pts.length < 2) return; const P = closed ? [...pts, pts[0]] : pts;
  const seg: number[] = [0]; for (let i = 1; i < P.length; i++) seg.push(seg[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = seg.at(-1)! * clamp(p); ctx.save(); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length; i++) { if (seg[i] <= L) ctx.lineTo(P[i][0], P[i][1]); else { const f = (L - seg[i - 1]) / (seg[i] - seg[i - 1]); ctx.lineTo(lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)); break; } }
  ctx.lineCap = "round"; ctx.lineJoin = "round"; if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; } ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); ctx.restore();
};
/** point at fraction p along a polyline, plus heading */
export const along = (pts: [number, number][], p: number): [number, number, number] => {
  const seg: number[] = [0]; for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = seg.at(-1)! * clamp(p); for (let i = 1; i < pts.length; i++) if (seg[i] >= L) { const f = (L - seg[i - 1]) / (seg[i] - seg[i - 1] || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  const a = pts.at(-2)!, b = pts.at(-1)!; return [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0])];
};
/** Catmull-Rom through points -> dense polyline (for routes, rivers and arcs) */
export const smoothPath = (pts: [number, number][], per = 12): [number, number][] => {
  if (pts.length < 3) return pts; const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)) as [number, number]); } }
  out.push(pts.at(-1)!); return out;
};
export const arrowHead = (ctx: Ctx, x: number, y: number, ang: number, s: number, color: string) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.62); ctx.lineTo(-s * 0.35, 0); ctx.lineTo(-s * 0.7, s * 0.62); ctx.closePath(); ctx.fill(); ctx.restore();
};
