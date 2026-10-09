// THE LAND, drawn in code. Approximate geography of the Land of Israel for a 1080x1920 frame:
// coast, Kinneret, Jordan, Dead Sea, places, and the tribal allotments as a weighted Voronoi
// (power diagram) clipped to each bank. Approximate on purpose: a teaching map, not a survey.
import { rng, type Ctx } from "../../engine/src/canvas-core/core";
import { C, FONT, clamp, smoothPath, strokeAlong, txt } from "./kit";

export type LL = [number, number]; // [lat, lon]
export type XY = [number, number];
// window lat 30.9..33.75, lon centred on 35.3; k px per degree of latitude
export const K = 491, LAT0 = 33.75, LON0 = 35.3, COS = Math.cos((32.3 * Math.PI) / 180), TOP = 170;
export const P = ([lat, lon]: LL): XY => [540 + (lon - LON0) * COS * K, TOP + (LAT0 - lat) * K];
const PS = (a: LL[]) => a.map(P);

// ---------------------------------------------------------------- data (lat, lon)
export const COAST: LL[] = [[33.78, 35.45], [33.56, 35.37], [33.46, 35.29], [33.27, 35.19], [33.17, 35.17], [33.09, 35.1], [33.0, 35.08], [32.92, 35.07], [32.84, 35.06], [32.81, 35.02], [32.83, 34.96], [32.69, 34.93], [32.62, 34.91], [32.5, 34.89], [32.33, 34.85], [32.16, 34.79], [32.05, 34.75], [31.8, 34.64], [31.67, 34.56], [31.52, 34.44], [31.32, 34.24], [31.26, 34.1]];
export const JORDAN_N: LL[] = [[33.25, 35.65], [33.15, 35.62], [33.08, 35.61], [33.0, 35.63], [32.89, 35.62]];
export const KINNERET: LL[] = [[32.89, 35.59], [32.87, 35.64], [32.8, 35.65], [32.72, 35.63], [32.705, 35.585], [32.73, 35.56], [32.79, 35.54], [32.85, 35.53]];
export const JORDAN_S: LL[] = [[32.705, 35.575], [32.62, 35.57], [32.5, 35.56], [32.4, 35.55], [32.3, 35.57], [32.2, 35.55], [32.08, 35.53], [31.95, 35.54], [31.85, 35.55], [31.765, 35.555]];
export const DEADSEA: LL[] = [[31.765, 35.555], [31.7, 35.585], [31.55, 35.575], [31.4, 35.57], [31.3, 35.52], [31.2, 35.52], [31.05, 35.45], [31.1, 35.39], [31.3, 35.4], [31.5, 35.465], [31.65, 35.48], [31.76, 35.51]];
export const HULA: LL = [33.08, 35.61];
export const PLACES: Record<string, LL> = {
  tyre: [33.27, 35.19], sidon: [33.56, 35.37], akko: [32.92, 35.07], dor: [32.62, 34.92], jaffa: [32.05, 34.75], ashdod: [31.8, 34.64], ashkelon: [31.67, 34.56], gaza: [31.52, 34.44], ekron: [31.78, 34.85], gath: [31.7, 34.84],
  gezer: [31.86, 34.92], megiddo: [32.58, 35.18], betshean: [32.5, 35.5], jerusalem: [31.78, 35.23], hazor: [33.02, 35.57], gibeon: [31.85, 35.18], shechem: [32.21, 35.28], gilgal: [31.86, 35.48], makkedah: [31.68, 34.95], lachish: [31.56, 34.85], hebron: [31.53, 35.1], debir: [31.42, 34.97], laish: [33.25, 35.65], merom: [33.0, 35.42], hermon: [33.42, 35.86], beersheba: [31.25, 34.79], shiloh: [32.05, 35.29],
};

// ---------------------------------------------------------------- polygons
const pathLL = (a: LL[]) => smoothPath(PS(a), 8);
export const coastXY = pathLL(COAST), kinXY = smoothPath([...PS(KINNERET), P(KINNERET[0])], 6), deadXY = smoothPath([...PS(DEADSEA), P(DEADSEA[0])], 6);
export const jordanXY = [...pathLL(JORDAN_N), ...PS([KINNERET[0]]), ...PS([[32.705, 35.575]]), ...pathLL(JORDAN_S)];
const jN = pathLL(JORDAN_N), jS = pathLL(JORDAN_S);
// west bank of the Jordan: coast down to the south-west corner, across the Negev, up the Dead Sea west shore and the river
const deadW = PS([[31.05, 35.45], [31.1, 35.39], [31.3, 35.4], [31.5, 35.465], [31.65, 35.48], [31.765, 35.53]]);
const kinW = PS([[32.705, 35.57], [32.73, 35.56], [32.79, 35.54], [32.85, 35.53], [32.89, 35.6]]);
// the Negev edge is drawn as a soft line, not a ruler
const NEGEV = smoothPath(PS([[31.18, 34.1], [31.02, 34.32], [30.98, 34.6], [31.03, 34.92], [30.98, 35.2], [31.05, 35.45]]), 6);
export const WEST: XY[] = [...PS([[33.5, 35.33]]), ...pathLL(COAST.slice(2)), ...NEGEV, ...deadW, ...[...jS].reverse(), ...kinW, ...[...jN].reverse(), ...PS([[33.5, 35.66]])];
const deadE = PS([[31.2, 35.52], [31.3, 35.52], [31.4, 35.57], [31.55, 35.575], [31.7, 35.585], [31.765, 35.57]]);
const kinE = PS([[32.705, 35.59], [32.72, 35.63], [32.8, 35.655], [32.87, 35.645], [32.92, 35.64]]);
// east of the Jordan the settled land fades into desert: an organic edge
const DESERT = smoothPath(PS([[33.3, 35.82], [33.26, 36.05], [33.02, 36.2], [32.62, 36.24], [32.2, 36.14], [31.82, 36.05], [31.46, 35.94], [31.2, 35.82], [31.2, 35.52]]), 6);
export const EAST: XY[] = [...deadE, ...jS.slice(1), ...kinE, ...PS([[33.1, 35.66]]), ...DESERT];
export const LAND_SEA_SPLIT: XY[] = [...PS([[35.5, 35.45]]), ...coastXY, ...PS([[29.5, 34.0], [29.5, 30], [35.5, 30]])]; // the sea, for filling

// ---------------------------------------------------------------- tribes
export type Tribe = { id: string; he: string; site: LL; wgt: number; hue: number; bank: "W" | "E" };
export const TRIBES: Tribe[] = [
  { id: "asher", he: "אשר", site: [33.08, 35.2], wgt: 0, hue: 195, bank: "W" },
  { id: "naphtali", he: "נפתלי", site: [33.05, 35.47], wgt: 0, hue: 262, bank: "W" },
  { id: "zebulun", he: "זבולון", site: [32.76, 35.27], wgt: -0.004, hue: 178, bank: "W" },
  { id: "issachar", he: "יששכר", site: [32.6, 35.43], wgt: -0.004, hue: 32, bank: "W" },
  { id: "manassehW", he: "מנשה", site: [32.36, 35.12], wgt: 0.008, hue: 140, bank: "W" },
  { id: "ephraim", he: "אפרים", site: [32.08, 35.2], wgt: 0, hue: 98, bank: "W" },
  { id: "benjamin", he: "בנימין", site: [31.85, 35.33], wgt: -0.012, hue: 318, bank: "W" },
  { id: "dan", he: "דן", site: [31.9, 34.84], wgt: -0.01, hue: 282, bank: "W" },
  { id: "judah", he: "יהודה", site: [31.48, 35.04], wgt: 0.05, hue: 44, bank: "W" },
  { id: "simeon", he: "שמעון", site: [31.12, 34.72], wgt: 0.0, hue: 14, bank: "W" },
  { id: "reuben", he: "ראובן", site: [31.6, 35.8], wgt: 0, hue: 354, bank: "E" },
  { id: "gad", he: "גד", site: [32.15, 35.78], wgt: 0, hue: 228, bank: "E" },
  { id: "manassehE", he: "חצי מנשה", site: [32.85, 35.95], wgt: 0.01, hue: 140, bank: "E" },
];
export const tribe = (id: string) => TRIBES.find((t) => t.id === id)!;
export const tribeColor = (id: string, a = 1, l = 52, s = 42) => `hsla(${tribe(id).hue},${s}%,${l}%,${a})`;

// clip a polygon by the half-plane a*x + b*y <= c (Sutherland-Hodgman)
const clipHalf = (poly: XY[], a: number, b: number, c: number): XY[] => {
  const out: XY[] = [], f = (p: XY) => a * p[0] + b * p[1] - c;
  poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q); if (fp <= 0) out.push(p); if (fp * fq < 0) { const t = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } });
  return out;
};
// Power diagram: x belongs to i if |x-si|^2 - wi <= |x-sj|^2 - wj  ->  2(sj-si).x <= |sj|^2-|si|^2 - wj + wi
const cells = (() => {
  const out: Record<string, XY[]> = {}, w = (t: Tribe) => t.wgt * K * K;
  for (const bank of ["W", "E"] as const) {
    const ts = TRIBES.filter((t) => t.bank === bank), region = bank === "W" ? WEST : EAST;
    for (const ti of ts) {
      let poly = region; const si = P(ti.site);
      for (const tj of ts) { if (tj === ti) continue; const sj = P(tj.site); poly = clipHalf(poly, 2 * (sj[0] - si[0]), 2 * (sj[1] - si[1]), sj[0] ** 2 + sj[1] ** 2 - si[0] ** 2 - si[1] ** 2 - w(tj) + w(ti)); }
      out[ti.id] = poly;
    }
  }
  return out;
})();
export const cell = (id: string) => cells[id];
export const centroid = (poly: XY[]): XY => { let a = 0, x = 0, y = 0; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], k = p[0] * q[1] - q[0] * p[1]; a += k; x += (p[0] + q[0]) * k; y += (p[1] + q[1]) * k; }); return a ? [x / (3 * a), y / (3 * a)] : poly[0]; };
export const inside = (poly: XY[], [x, y]: XY) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
export const label = (id: string): XY => { const c = centroid(cell(id)); return id === "judah" ? [c[0] + 10, c[1] - 30] : id === "simeon" ? [c[0] + 30, c[1] + 10] : c; };

/** seeded villages: Poisson-ish scatter over both banks, with a reveal order */
export const VILLAGES: { p: XY; ord: number; k: number }[] = (() => {
  const r = rng(929), pts: XY[] = [], minD = 30;
  for (let tries = 0; pts.length < 150 && tries < 20000; tries++) {
    const p: XY = [90 + r() * 900, P([33.45, 0])[1] + r() * (P([31.0, 0])[1] - P([33.45, 0])[1])];
    if (!(inside(WEST, p) || inside(EAST, p)) || pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < minD)) continue; pts.push(p);
  }
  const ord = pts.map((_, i) => i).sort(() => r() - 0.5);
  return pts.map((p, i) => ({ p, ord: ord.indexOf(i) / pts.length, k: r() }));
})();

// ---------------------------------------------------------------- drawing
export type Cam = { s: number; cx: number; cy: number; ox: number; oy: number }; // zoom s about map point (cx,cy), placed at screen (ox,oy)
export const CAM0: Cam = { s: 1, cx: 540, cy: 870, ox: 540, oy: 870 };
export const camLerp = (a: Cam, b: Cam, t: number): Cam => ({ s: a.s + (b.s - a.s) * t, cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, ox: a.ox + (b.ox - a.ox) * t, oy: a.oy + (b.oy - a.oy) * t });
export const applyCam = (ctx: Ctx, c: Cam) => { ctx.translate(c.ox, c.oy); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy); };
export const toScreen = (c: Cam, [x, y]: XY): XY => [(x - c.cx) * c.s + c.ox, (y - c.cy) * c.s + c.oy];

const fillPoly = (ctx: Ctx, poly: XY[]) => { ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
export type MapState = { coast: number; water: number; names: number; hills: number; alpha: number };
/** the base map: sea wash, land tone, hill hatching, coast and rivers in gold ink */
export const baseMap = (ctx: Ctx, m: MapState, t: number) => {
  if (m.alpha <= 0) return; ctx.save(); ctx.globalAlpha *= m.alpha; const base = ctx.globalAlpha;
  // sea: a cold wash west of the coast, revealed with the coastline
  if (m.water > 0) {
    ctx.save(); ctx.globalAlpha = base * m.water; fillPoly(ctx, LAND_SEA_SPLIT); const g = ctx.createLinearGradient(0, 0, 540, 0); g.addColorStop(0, "rgba(22,40,56,0.85)"); g.addColorStop(1, "rgba(30,52,70,0.55)"); ctx.fillStyle = g; ctx.fill();
    // wave hatching on the sea
    ctx.strokeStyle = "rgba(140,180,200,0.12)"; ctx.lineWidth = 1.5; for (let y = 200; y < 1700; y += 26) { ctx.beginPath(); for (let x = 0; x < 560; x += 8) { const yy = y + Math.sin(x * 0.05 + y + t * 0.6) * 3; x ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
    [kinXY, deadXY].forEach((poly) => { fillPoly(ctx, poly); ctx.fillStyle = "rgba(36,66,86,0.95)"; ctx.fill(); });
    ctx.restore();
  }
  // hill-country hatching along the central ridge
  if (m.hills > 0) {
    const r = rng(41); ctx.save(); ctx.strokeStyle = C.goldLo; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    for (let i = 0; i < 260; i++) {
      const lat = 31.2 + r() * 2.0, ridge = 35.13 + (lat - 31.2) * 0.08 + (r() - 0.5) * 0.35, p = P([lat, lat > 32.65 ? ridge + 0.12 : ridge]);
      const e = P([31.4 + r() * 1.9, 35.95 + r() * 0.3]), q = r() < 0.72 ? p : e; if (!(inside(WEST, q) || inside(EAST, q))) continue;
      const vis = clamp(m.hills * 1.4 - (i / 260) * 0.4); if (vis <= 0) continue; ctx.globalAlpha = base * vis * 0.55; const s = 7 + r() * 6;
      ctx.beginPath(); ctx.moveTo(q[0] - s, q[1] + s * 0.5); ctx.quadraticCurveTo(q[0], q[1] - s * 0.7, q[0] + s, q[1] + s * 0.5); ctx.stroke();
    }
    ctx.restore();
  }
  // coast + rivers + lakes: gold ink drawn progressively
  strokeAlong(ctx, coastXY, m.coast, "rgba(227,181,91,0.35)", 9, 0);
  strokeAlong(ctx, coastXY, m.coast, C.gold, 3.2, 14);
  const r2 = clamp((m.coast - 0.35) / 0.65);
  strokeAlong(ctx, jordanXY, r2, "#8fb4c8", 2.6, 8); strokeAlong(ctx, kinXY, r2, "#8fb4c8", 2.4, 6, true); strokeAlong(ctx, deadXY, r2, "#8fb4c8", 2.4, 6, true);
  if (m.names > 0) {
    const n = m.names, it = (s: string, ll: LL, px: number, dx = 0, dy = 0, rot = 0) => { const [x, y] = P(ll); ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(rot); txt(ctx, s, 0, 0, px, "#9fc3d6", { w: 500, fam: FONT.verse, alpha: n * 0.9 }); ctx.restore(); };
    it("הַיָּם הַגָּדוֹל", [32.2, 34.35], 40, 0, 0, -1.2); it("כִּנֶּרֶת", KINNERET[2], 22, 52, 8); it("יָם הַמֶּלַח", [31.45, 35.5], 22, -78, 0); it("יַרְדֵּן", [32.25, 35.55], 22, 34, 0, -1.45);
  }
  ctx.restore();
};
/** one tribal allotment: soft fill, inked border; grow animates a reveal from the site outward */
export const territory = (ctx: Ctx, id: string, a: number, o: { grow?: number; l?: number; s?: number; edge?: number; dash?: boolean; poly?: XY[] } = {}) => {
  if (a <= 0) return; const poly = o.poly ?? cell(id), g = o.grow ?? 1; if (g <= 0) return;
  ctx.save(); const base = ctx.globalAlpha;
  if (g < 1) { const [sx, sy] = P(tribe(id).site); ctx.beginPath(); ctx.arc(sx, sy, 10 + g * 420, 0, 6.283); ctx.clip(); }
  fillPoly(ctx, poly); ctx.globalAlpha = base * a; ctx.fillStyle = tribeColor(id, 0.5, o.l ?? 46, o.s ?? 42); ctx.fill();
  ctx.globalAlpha = base * a * (o.edge ?? 1); ctx.strokeStyle = "rgba(248,226,160,0.7)"; ctx.lineWidth = 2; ctx.lineJoin = "round"; if (o.dash) ctx.setLineDash([10, 9]); ctx.stroke();
  ctx.restore();
};
export const tribeLabel = (ctx: Ctx, id: string, a: number, scale = 1, at?: XY, color = C.cream) => {
  if (a <= 0) return; const [x, y] = at ?? label(id); ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  txt(ctx, tribe(id).he, 0, 10, 30, color, { w: 800, alpha: a, stroke: "rgba(12,9,6,0.75)", strokeW: 7 }); ctx.restore();
};
/** a place dot with a name; ring for emphasis */
export const place = (ctx: Ctx, name: string, ll: LL, a: number, o: { color?: string; ring?: number; side?: 1 | -1; px?: number; r?: number } = {}) => {
  if (a <= 0) return; const [x, y] = P(ll), col = o.color ?? C.goldHi; ctx.save(); const base = ctx.globalAlpha; ctx.globalAlpha = base * a;
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x, y, o.r ?? 7, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
  if (o.ring) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = base * a * (1 - o.ring); ctx.beginPath(); ctx.arc(x, y, 10 + o.ring * 40, 0, 6.283); ctx.stroke(); ctx.globalAlpha = base * a; }
  const side = o.side ?? -1; txt(ctx, name, x + side * 16, y + 10, o.px ?? 30, C.cream, { w: 700, align: side < 0 ? "right" : "left", stroke: "rgba(12,9,6,0.8)", strokeW: 7 });
  ctx.restore();
};
