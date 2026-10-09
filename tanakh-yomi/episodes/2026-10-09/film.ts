// התנ"ך היומי · יהושע י"ג–י"ד (9.10.2026)
// Story: "the land remains" -> conquest is not inheritance -> the task passes to every tribe ->
// the map has a plan, and the plan bends to choices -> Caleb, 85, asks for the hardest mountain.
// Token: the root י-ר-ש. It is the last word of the first verse (לְרִשְׁתָּהּ) and returns in
// Caleb's mouth (וְהוֹרַשְׁתִּים). The map is the hero; four painted plates carry the mood.
// Every cue below is a spoken word (timing.json): the narration is the clock.
import type { Film, Shot } from "../../../engine/src/canvas-core/film";
import { rng, type Ctx, type Env } from "../../../engine/src/canvas-core/core";
import timingJson from "./timing.json";
import {
  W, H, FPS, C, FONT, clamp, lerp, prog, eio, eout, ein, eback, vis, pulse, clock, captions, drawCaption, parchment, grain, vignette, scrim, plate, motes, txt, verseLine, goldFill, chip, header, strokeAlong, along, smoothPath, arrowHead, type Timing,
} from "../../film/kit";
import { P, CAM0, camLerp, applyCam, toScreen, baseMap, territory, tribeLabel, place, PLACES, TRIBES, VILLAGES, cell, label, inside, centroid, tribe, tribeColor, type Cam, type XY } from "../../film/geo";

const T = timingJson as Timing, K = clock(T), S = K.scene, at = K.at, CAPS = captions(T);
const DUR = T.duration;

// ---------------------------------------------------------------- cue sheet (seconds)
const Q = {
  v1: ["והארץ", "נשארה", "הרבה", "מאד", "לרשתה"].map((w) => at("hook", w)),
  vA: [at("clash", "ויקח"), at("clash", "יהושע"), at("clash", "את"), at("clash", "כל"), at("clash", "הארץ")],
  slam: at("clash", "אז"), q1: at("clash", "כבשו"), q2: at("clash", "שנשאר"), qmark: at("clash", "מאוד"),
  binNun: at("key", "הרב"), between: at("key", "הבדל"), kibush: at("key", "לכבוש"), horish: at("key", "להוריש"),
  conq: S("conquest").start, south: at("conquest", "לדרום") - 0.3, north: at("conquest", "לצפון") - 0.3, fast: at("conquest", "מהר"), sharp: at("conquest", "וחד"),
  inh: S("inherit").start, every: at("inherit", "כפר"), oneByOne: at("inherit", "אחד"), gezer: at("inherit", "גזר"), megiddo: at("inherit", "מגידו"), betshean: at("inherit", "בית"), jerus: at("inherit", "ירושלים"), still: at("inherit", "דורות"),
  threat: S("threat").start, altars: at("threat", "המזבחות"), fromNow: at("threat", "ומעכשיו"), leader: at("threat", "מנהיג"), everyTribe: at("threat", "שבט"),
  lots: S("lots").start, ch14: at("lots", "פרק"), spread: at("lots", "פורשים"), cast: at("lots", "ומטילים"),
  pat: S("pattern").start, camp: at("pattern", "במחנה"), center: at("pattern", "יהודה"), maids: at("pattern", "השפחות") - 0.3, firsts: at("pattern", "הבכורים"),
  brk: S("breaks").start, reuben: at("breaks", "ראובן"), lost: at("breaks", "ואיבד"), simLevi: at("breaks", "שמעון"), shechem: at("breaks", "שכם"), scatter: at("breaks", "מפוזרים"), twoHalf: at("breaks", "שניים"), slack: at("breaks", "שהתרפה"), less: at("breaks", "פחות"),
  caleb: S("caleb").start, age: at("caleb", "בן"), giants: at("caleb", "הענקים"), give: [at("caleb", "תנה"), at("caleb", "ההר", 1), at("caleb", "הזה")], horashtim: at("caleb", "והורשתים"), heard: at("caleb", "שמעתם"), same: at("caleb", "אותה"),
  fin: S("finale").start, plan: at("finale", "תוכנית"), each: at("finale", "אבל"), his: at("finale", "התוכנית"), ours: at("finale", "הבחירה"), endCard: S("finale").speechEnd + 0.3,
};
// captions step aside while a verse is being written on screen, and for the closing words
const QUIET: [number, number][] = [[Q.v1[0] - 0.2, S("hook").end], [Q.vA[0] - 0.2, Q.vA[4] + 0.7], [Q.give[0] - 0.2, Q.heard - 0.1], [Q.his - 0.2, DUR]];
const hideCaps = (t: number) => QUIET.some(([a, b]) => t >= a && t < b) || t < 0.5;

// ---------------------------------------------------------------- sound design (rendered by render.mjs)
export const music = "music.mp3", musicGain = 0.5;
export const sfx: { t: number; name: string; gain: number }[] = [
  [0.15, "whoosh_soft", 0.4], [Q.v1[0] - 0.1, "shimmer", 0.45], [S("clash").start - 0.2, "whoosh_soft", 0.45], [Q.vA[0] - 0.1, "page_turn", 0.35],
  [Q.slam + 0.42, "impact_clash", 0.8], [Q.qmark + 0.3, "drum_hit", 0.55], [S("key").start - 0.15, "whoosh_soft", 0.45], [Q.kibush, "whoosh_fast", 0.45], [Q.horish + 0.1, "ember_pop", 0.4],
  [Q.conq, "ink_scratch", 0.55], [Q.south, "whoosh_fast", 0.6], [Q.south + 1.0, "drum_hit", 0.5], [Q.north, "whoosh_fast", 0.6], [Q.north + 1.0, "drum_hit", 0.55], [Q.fast, "drum_hit", 0.7], [Q.sharp, "drum_hit", 0.85],
  [Q.inh, "whoosh_soft", 0.35], [Q.every, "ember_pop", 0.35], [Q.oneByOne, "ember_pop", 0.4], [Q.oneByOne + 0.6, "ember_pop", 0.35],
  [Q.gezer, "stone_click", 0.4], [Q.megiddo, "stone_click", 0.4], [Q.betshean, "stone_click", 0.4], [Q.jerus, "stone_click", 0.45],
  [Q.threat - 0.1, "whoosh_soft", 0.45], [Q.fromNow - 0.2, "whoosh_soft", 0.35], [Q.everyTribe - 0.1, "shimmer", 0.55],
  [Q.lots - 0.1, "page_turn", 0.6], [Q.spread, "parchment_unroll", 0.6], ...[0, 0.35, 0.7, 1.05, 1.4].map((d) => [Q.cast + d, "stone_click", 0.4] as [number, string, number]),
  [Q.camp - 0.2, "whoosh_soft", 0.3], [Q.center, "shimmer", 0.35], [Q.brk + 0.3, "riser", 0.35], [Q.lost + 0.1, "shimmer", 0.55], [Q.shechem, "drum_hit", 0.45], [Q.scatter, "whoosh_fast", 0.45],
  [Q.twoHalf, "whoosh_soft", 0.45], [Q.slack, "whoosh_fast", 0.45], [Q.caleb - 0.15, "whoosh_soft", 0.45], [Q.age, "drum_hit", 0.55], [Q.give[0] - 0.1, "shimmer", 0.45], [Q.horashtim, "drum_hit", 0.7], [Q.same, "shimmer", 0.65],
  [Q.fin - 0.1, "whoosh_soft", 0.35], [Q.his, "drum_hit", 0.55], [Q.ours, "drum_hit", 0.75], [Q.endCard, "shimmer", 0.35],
].map(([t, name, gain]) => ({ t: t as number, name: name as string, gain: gain as number }));

// ---------------------------------------------------------------- pieces
const verseRef = (ctx: Ctx, s: string, x: number, y: number, a: number) => txt(ctx, s, x, y, 30, C.cream, { w: 500, alpha: a * 0.8, fam: FONT.ui });
const card = (ctx: Ctx, x: number, y: number, w: number, h: number, a: number, draw: number) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(10,8,6,0.55)"; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 14); ctx.fill(); ctx.restore();
  const p: XY[] = [[x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2], [x - w / 2, y - h / 2], [x + w / 2, y - h / 2]]; ctx.save(); ctx.globalAlpha = a; strokeAlong(ctx, p, draw, C.gold, 2.5, 10); ctx.restore();
};
const crown = (ctx: Ctx, x: number, y: number, s: number, a: number) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = C.goldHi; ctx.shadowColor = C.gold; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.moveTo(-30, 16); ctx.lineTo(-34, -14); ctx.lineTo(-16, 2); ctx.lineTo(0, -24); ctx.lineTo(16, 2); ctx.lineTo(34, -14); ctx.lineTo(30, 16); ctx.closePath(); ctx.fill();
  ctx.fillRect(-30, 19, 60, 8); [-34, 0, 34].forEach((cx, i) => { ctx.beginPath(); ctx.arc(cx, i === 1 ? -26 : -16, 5, 0, 6.283); ctx.fill(); }); ctx.restore();
};
const mountain = (ctx: Ctx, x: number, y: number, s: number, a: number) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = C.goldHi; ctx.shadowColor = C.gold; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.moveTo(-22, 12); ctx.lineTo(-4, -16); ctx.lineTo(4, -6); ctx.lineTo(10, -13); ctx.lineTo(24, 12); ctx.closePath(); ctx.fill(); ctx.restore();
};
/** a title stamped over the sea, the scene's one-word thesis */
const stamp = (ctx: Ctx, s: string, a: number, t: number, y = 640, x = 228, size = 1) => {
  if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(x, y); const k = size * (1 + (1 - eout(clamp(a))) * 0.35); ctx.scale(k, k);
  txt(ctx, s, 0, 0, 92, goldFill(ctx, 0, 92, t) as unknown as string, { w: 900, fam: FONT.verse, glow: 26, stroke: "rgba(8,6,4,0.7)", strokeW: 10 }); ctx.restore();
};
/** a gold flight path from a to b that arcs, with the traveller at p */
const flight = (a: XY, b: XY, bow = 0.25): XY[] => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return smoothPath([a, [mx - dy * bow, my + dx * bow], b], 16); };

// camp of Numbers 2, north up so it lines up with the map: east = right
const CAMP_C: XY = [540, 450];
const CAMP: Record<string, XY> = { judah: [282, 0], issachar: [282, -82], zebulun: [282, 82], ephraim: [-282, 0], manassehW: [-282, -82], benjamin: [-282, 82], dan: [0, -190], asher: [-180, -190], naphtali: [180, -190], reuben: [0, 190], simeon: [-180, 190], gad: [180, 190] };
const TWELVE = ["asher", "naphtali", "zebulun", "issachar", "manassehW", "ephraim", "benjamin", "dan", "judah", "simeon", "reuben", "gad"];
const LOT_ORDER = ["judah", "ephraim", "manassehW", "manassehE", "benjamin", "simeon", "zebulun", "issachar", "asher", "naphtali", "dan", "reuben", "gad"];
const LEVI: XY[] = (() => { const r = rng(48), out: XY[] = []; const polys = TRIBES.map((t) => cell(t.id)); while (out.length < 48) { const pl = polys[Math.floor(r() * polys.length)], c = centroid(pl), p: XY = [c[0] + (r() - 0.5) * 160, c[1] + (r() - 0.5) * 160]; if (inside(pl, p)) out.push(p); } return out; })();
const DAN_NORTH: XY[] = (() => { const c = P(PLACES.laish); return Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * 6.283; return [c[0] + Math.cos(a) * 34, c[1] + Math.sin(a) * 26] as XY; }); })();
const SOUTH_ROUTE = smoothPath([P(PLACES.gilgal), P(PLACES.gibeon), P(PLACES.makkedah), P(PLACES.lachish), P(PLACES.hebron), P(PLACES.debir)], 14);
const NORTH_ROUTE = smoothPath([P(PLACES.gilgal), P([32.4, 35.42]), P([32.75, 35.36]), P(PLACES.merom), P(PLACES.hazor)], 14);
const scaledPoly = (poly: XY[], c: XY, k: number): XY[] => poly.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);

// ---------------------------------------------------------------- the map layer, all scenes
const mapCam = (t: number): Cam => {
  let c = CAM0;
  const punch = 0.025 * (pulse(t, Q.fast, 0.5) + pulse(t, Q.sharp, 0.5));
  c = { ...c, s: c.s + punch + 0.05 * eio(prog(t, Q.gezer - 0.5, Q.gezer + 1.5)) - 0.05 * eio(prog(t, Q.still, Q.still + 1.5)) };
  const PAT: Cam = { s: 0.62, cx: 540, cy: 870, ox: 540, oy: 1135 };
  c = camLerp(c, PAT, eio(prog(t, Q.camp - 0.7, Q.camp + 0.5)) * (1 - eio(prog(t, S("pattern").end - 1.0, S("pattern").end + 0.2))));
  c = camLerp(c, { ...CAM0, cx: 620, s: 1.06 }, eio(prog(t, Q.twoHalf - 0.3, Q.twoHalf + 0.9)) * (1 - eio(prog(t, Q.slack - 0.4, Q.slack + 0.6))));
  c = camLerp(c, { ...CAM0, cx: 540, cy: 600, s: 1.18 }, eio(prog(t, Q.slack - 0.2, Q.slack + 0.8)) * (1 - eio(prog(t, Q.caleb, Q.caleb + 0.6))));
  if (t > Q.fin) c = camLerp({ ...CAM0, s: 1.08 }, { ...CAM0, s: 0.97 }, eio(prog(t, Q.fin, Q.endCard)));
  return c;
};
const mapAlpha = (t: number) => {
  if (t < Q.conq - 0.4) return 0;
  // the map yields to plates, the chapter card, and the closing words
  const out = (a: number, b: number) => 1 - vis(t, a, b, 0.7, 0.7);
  return eio(prog(t, Q.conq - 0.4, Q.conq + 0.3)) * out(Q.threat, Q.fromNow + 0.4) * out(Q.lots - 0.2, Q.spread + 0.3) * out(Q.caleb, Q.fin + 0.2) * (1 - 0.86 * eio(prog(t, Q.his - 0.4, Q.his + 0.4))) * (1 - eio(prog(t, Q.endCard, Q.endCard + 0.8)));
};

const drawMap = (out: Ctx, env: Env, t: number) => {
  const A = mapAlpha(t); if (A <= 0.003) return; const cam = mapCam(t);
  // drawn on its own layer so the whole map fades as one sheet
  let layer = env.cache.get("mapLayer") as ReturnType<Env["canvas"]> | undefined; if (!layer) { layer = env.canvas(W, H); env.cache.set("mapLayer", layer); }
  const ctx = layer.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  ctx.save();
  // the map "unrolls" in chapter 14: a clip opening from the centre outward
  if (t > Q.spread - 0.4 && t < Q.spread + 1.4) { const u = eio(prog(t, Q.spread - 0.2, Q.spread + 1.1)), w = W * u; ctx.beginPath(); ctx.rect(W / 2 - w / 2, 0, w, H); ctx.clip(); }
  applyCam(ctx, cam);
  baseMap(ctx, { alpha: 1, coast: eio(prog(t, Q.conq, Q.conq + 1.8)), water: eio(prog(t, Q.conq + 0.6, Q.conq + 1.6)), hills: prog(t, Q.conq + 1.0, Q.conq + 2.2), names: prog(t, Q.conq + 1.6, Q.conq + 2.4) }, t);

  // --- territories (chapter 14 onward)
  const terrOn = t > Q.cast - 0.2;
  if (terrOn) {
    const lotP = (id: string) => eout(prog(t, Q.cast + LOT_ORDER.indexOf(id) * 0.16, Q.cast + LOT_ORDER.indexOf(id) * 0.16 + 0.6));
    const patDim = (id: string) => {
      // pattern scene: one group lit, the rest dimmed
      const grp = (a: number, b: number, ids: string[]) => (ids.includes(id) ? 0 : vis(t, a, b, 0.3, 0.3));
      return 1 - 0.75 * Math.max(grp(Q.center - 0.1, Q.maids - 0.1, ["judah", "ephraim", "manassehW"]), grp(Q.maids, Q.firsts - 0.1, ["dan", "naphtali", "gad", "asher"]), grp(Q.firsts, S("pattern").end - 0.6, ["reuben", "gad", "manassehE", "manassehW", "dan"]));
    };
    const planDash = vis(t, Q.brk + 0.2, Q.reuben, 0.4, 0.5) + vis(t, Q.plan - 0.1, Q.each + 0.3, 0.3, 0.4);
    for (const tr of TRIBES) {
      let poly = cell(tr.id), a = lotP(tr.id) * patDim(tr.id);
      if (tr.id === "simeon") { const m = eio(prog(t, Q.scatter, Q.scatter + 1.4)); if (m > 0) { territory(ctx, "judah", a * m, { poly, edge: 0 }); a *= 1 - m; } }
      if (tr.id === "dan") { const k = eio(prog(t, Q.slack, Q.slack + 1.2)); poly = scaledPoly(poly, P(tr.site), 1 - 0.45 * k); }
      const east = tr.bank === "E" ? pulse(t, Q.twoHalf + 0.3, 2.4) : 0;
      territory(ctx, tr.id, a, { poly, l: 46 + 18 * east, s: 42 + 20 * east, dash: planDash > 0.5 && t < Q.fin + 1.5 });
    }
    // Dan's second home in the far north (Judges 18)
    const dn = eout(prog(t, Q.slack + 0.6, Q.slack + 1.4)); if (dn > 0) territory(ctx, "dan", dn, { poly: DAN_NORTH });
    for (const tr of TRIBES) {
      const a = lotP(tr.id) * patDim(tr.id) * (tr.id === "simeon" ? 1 - eio(prog(t, Q.scatter, Q.scatter + 1.0)) : 1), sc = 1 + 0.25 * pulse(t, Q.lost + 0.9, 0.8) * +(tr.id === "ephraim");
      let at: XY | undefined = undefined; if (tr.id === "simeon") { const c = label("simeon"), j = label("judah"), m = eio(prog(t, Q.scatter, Q.scatter + 1.0)); at = [lerp(c[0], j[0], m), lerp(c[1], j[1], m)]; }
      if (tr.id === "dan") { const c = label("dan"), k = eio(prog(t, Q.slack, Q.slack + 1.2)); at = [c[0], c[1] - 6 * k]; }
      tribeLabel(ctx, tr.id, a, sc, at);
    }
    if (dn > 0) tribeLabel(ctx, "dan", dn, 0.9, [P(PLACES.laish)[0] + 52, P(PLACES.laish)[1] + 4]);
  }

  // --- conquest: two campaigns, swift
  const arrowsA = vis(t, Q.south, Q.lots - 0.4, 0.2, 0.5) * (1 - 0.65 * eio(prog(t, Q.inh, Q.inh + 0.8)));
  if (arrowsA > 0) {
    const flash = 1 + 0.6 * (pulse(t, Q.fast, 0.5) + pulse(t, Q.sharp, 0.5));
    [[SOUTH_ROUTE, Q.south], [NORTH_ROUTE, Q.north]].forEach(([route, t0]) => {
      const r = route as XY[], p = eio(prog(t, t0 as number, (t0 as number) + 1.0)); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha = arrowsA; strokeAlong(ctx, r, p, "rgba(208,86,60,0.45)", 22 * flash, 0); strokeAlong(ctx, r, p, C.blood, 9, 18 * flash); const [x, y, ang] = along(r, p); arrowHead(ctx, x, y, ang, 26, C.blood); ctx.restore();
    });
    place(ctx, "גבעון", PLACES.gibeon, arrowsA * eout(prog(t, Q.south + 0.15, Q.south + 0.5)), { side: 1, px: 26 });
    place(ctx, "חצור", PLACES.hazor, arrowsA * eout(prog(t, Q.north + 0.9, Q.north + 1.2)), { side: 1, px: 26, ring: prog(t, Q.north + 1.0, Q.north + 1.8) });
    // Hazor burns (Joshua 11:11)
    const fire = vis(t, Q.north + 1.0, Q.inh + 0.5, 0.2, 0.8); if (fire > 0) { const [hx, hy] = P(PLACES.hazor); motes(ctx, t, 11, 14, fire * arrowsA, { x: hx - 18, y: hy - 70, w: 36, h: 70 }, "255,140,60"); }
  }

  // --- inheritance: every village, one by one; the ones still standing generations later
  if (t > Q.every - 0.4 && t < Q.lots) {
    const fadeAll = 1 - eio(prog(t, Q.fromNow + 2.2, Q.everyTribe + 0.6));
    for (const v of VILLAGES) {
      const on = eout(prog(t, Q.every - 0.3 + v.ord * 1.6, Q.every - 0.1 + v.ord * 1.6)), outT = Q.oneByOne + 0.1 + v.ord * 16, off = prog(t, outT, outT + 0.5);
      if (on <= 0) continue; const [x, y] = v.p, glow = 0.65 + 0.35 * Math.sin(t * 3 + v.k * 9);
      ctx.save(); ctx.globalAlpha = on * fadeAll; ctx.fillStyle = off >= 1 ? "rgba(248,226,160,0.35)" : C.ember; ctx.shadowColor = C.ember; ctx.shadowBlur = off >= 1 ? 0 : 14 * glow;
      ctx.beginPath(); ctx.arc(x, y, off >= 1 ? 3 : 5.5 * (1 - 0.5 * off) * glow + 1.5, 0, 6.283); ctx.fill(); ctx.restore();
    }
    const cities: [string, keyof typeof PLACES, number, 1 | -1][] = [["גזר", "gezer", Q.gezer, -1], ["מגידו", "megiddo", Q.megiddo, -1], ["בית שאן", "betshean", Q.betshean, -1], ["ירושלים", "jerusalem", Q.jerus, 1]];
    cities.forEach(([n, k, t0, side]) => place(ctx, n, PLACES[k], vis(t, t0 - 0.1, Q.threat + 0.6, 0.25, 0.6), { color: C.blood, ring: prog(t, t0, t0 + 0.9), side, px: 30, r: 9 }));
    // Philistine five (13:3), still standing
    const ph = vis(t, Q.still - 0.1, Q.threat + 0.6, 0.4, 0.6);
    if (ph > 0) (["gaza", "ashkelon", "ashdod", "gath", "ekron"] as const).forEach((k, i) => place(ctx, "", PLACES[k], ph * eout(prog(t, Q.still + i * 0.12, Q.still + 0.4 + i * 0.12)), { color: C.blood, r: 7, ring: prog(t, Q.still + 0.3, Q.still + 1.3) }));
  }

  // --- one leader -> every tribe
  const one = vis(t, Q.leader - 0.2, Q.everyTribe + 1.1, 0.3, 0.35);
  if (t > Q.leader - 0.3 && t < Q.lots) {
    const src = P([31.95, 35.25]);
    if (one > 0) { ctx.save(); ctx.globalAlpha = one; ctx.fillStyle = C.goldHi; ctx.shadowColor = C.gold; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(src[0], src[1], 15 + 4 * Math.sin(t * 6), 0, 6.283); ctx.fill(); ctx.restore(); txt(ctx, "יהושע", src[0], src[1] - 32, 30, C.goldHi, { w: 800, alpha: one * (1 - prog(t, Q.everyTribe - 0.3, Q.everyTribe)), stroke: "rgba(0,0,0,0.7)", strokeW: 7 }); }
    TWELVE.forEach((id, i) => {
      const t0 = Q.everyTribe - 0.35 + i * 0.03, p = eio(prog(t, t0, t0 + 0.9)); if (p <= 0) return; const route = flight(src, label(id), 0.18 * (i % 2 ? 1 : -1)), [x, y] = along(route, p), a = 1 - prog(t, Q.lots - 0.6, Q.lots - 0.1);
      ctx.save(); ctx.globalAlpha = a; strokeAlong(ctx, route, p, "rgba(248,226,160,0.45)", 2.5, 8); ctx.fillStyle = C.goldHi; ctx.shadowColor = C.gold; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill(); ctx.restore();
      tribeLabel(ctx, id, a * eout(prog(t, t0 + 0.75, t0 + 1.1)), 1, undefined, C.goldHi);
    });
  }

  // --- the firstborn, side by side
  const fb = vis(t, Q.firsts + 0.1, S("pattern").end - 0.6, 0.6, 0.4);
  if (fb > 0) { ctx.save(); ctx.globalAlpha = fb; strokeAlong(ctx, smoothPath([label("reuben"), label("gad"), label("manassehE"), P(PLACES.laish)], 10), eio(prog(t, Q.firsts + 0.1, Q.firsts + 1.2)), C.goldHi, 4, 16); ctx.restore(); }

  // --- breaks: Reuben's crown, Shechem, Levi scattered, the east bank chosen
  if (t > Q.reuben - 0.3 && t < Q.caleb + 0.8) {
    const rp = label("reuben"), jp = label("ephraim"), cp = eio(prog(t, Q.lost, Q.lost + 1.0));
    const cpos: XY = [lerp(rp[0], jp[0] - 40, cp), lerp(rp[1] - 60, jp[1] - 50, cp) - Math.sin(cp * Math.PI) * 140];
    crown(ctx, cpos[0], cpos[1], 0.9 + 0.3 * Math.sin(cp * Math.PI), eback(prog(t, Q.reuben - 0.1, Q.reuben + 0.4)) * (1 - prog(t, Q.simLevi + 0.8, Q.simLevi + 1.4)));
    place(ctx, "שכם", PLACES.shechem, vis(t, Q.shechem - 0.2, Q.twoHalf, 0.2, 0.5), { color: C.blood, ring: prog(t, Q.shechem, Q.shechem + 0.9), side: 1 });
    // Levi: one name breaks into 48 cities across every tribe
    const lv = prog(t, Q.scatter, Q.scatter + 1.2), c0 = P([32.05, 35.15]);
    txt(ctx, "לוי", c0[0], c0[1], 44, C.goldHi, { w: 900, alpha: vis(t, Q.simLevi + 0.2, Q.scatter + 0.3, 0.3, 0.3), glow: 20, stroke: "rgba(0,0,0,0.7)", strokeW: 8 });
    if (lv > 0) LEVI.forEach((p, i) => { const k = eout(clamp(lv * 1.4 - (i / 48) * 0.4)); if (k <= 0) return; ctx.save(); ctx.fillStyle = C.goldHi; ctx.shadowColor = C.gold; ctx.shadowBlur = 10; ctx.globalAlpha = 0.9 * (1 - prog(t, Q.caleb - 0.4, Q.caleb + 0.4)); ctx.beginPath(); ctx.arc(lerp(c0[0], p[0], k), lerp(c0[1], p[1], k), 4.5, 0, 6.283); ctx.fill(); ctx.restore(); });
    // two and a half tribes cross east, by choice
    const ea = vis(t, Q.twoHalf, Q.slack, 0.3, 0.5);
    if (ea > 0) (["reuben", "gad", "manassehE"] as const).forEach((id, i) => { const to = label(id), from: XY = [P([0, 35.25])[0], to[1] + 20], r = flight(from, to, 0.12), p = eio(prog(t, Q.twoHalf + 0.2 + i * 0.25, Q.twoHalf + 1.1 + i * 0.25)); if (p <= 0) return; ctx.save(); ctx.globalAlpha = ea; strokeAlong(ctx, r, p, C.goldHi, 5, 14); const [x, y, a] = along(r, p); arrowHead(ctx, x, y, a, 18, C.goldHi); ctx.restore(); });
    // Dan, squeezed, migrates north
    const dm = vis(t, Q.slack + 0.2, Q.caleb + 0.2, 0.2, 0.6);
    if (dm > 0) { const r = flight(label("dan"), [P(PLACES.laish)[0] - 10, P(PLACES.laish)[1] + 24], -0.12), p = eio(prog(t, Q.slack + 0.2, Q.slack + 1.3)); ctx.save(); ctx.globalAlpha = dm; strokeAlong(ctx, r, p, C.goldHi, 4, 12); const [x, y, a] = along(r, p); arrowHead(ctx, x, y, a, 16, C.goldHi); ctx.restore(); }
  }

  // --- finale: every tribe chooses its own mountain
  if (t > Q.each - 0.2) TWELVE.forEach((id, i) => { const t0 = Q.each + 0.25 + i * 0.12, l = id === "simeon" ? label("judah") : label(id); mountain(ctx, l[0] + (id === "simeon" ? 46 : 0), l[1] - 40, 1, eback(prog(t, t0, t0 + 0.4)) * (1 - prog(t, Q.endCard - 0.5, Q.endCard))); });
  ctx.restore();
  out.save(); out.globalAlpha = A; out.drawImage(layer.canvas, 0, 0); out.restore();
};

// ---------------------------------------------------------------- the frame
const draw = (ctx: Ctx, env: Env, frame: number) => {
  const t = frame / FPS;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  parchment(ctx, env, t, 1);

  // ===== HOOK: Joshua, old, above a land that is not finished
  const pJ = 1 - eio(prog(t, S("clash").start - 0.3, S("clash").start + 0.7));
  if (pJ > 0) {
    plate(ctx, env, "joshua", eio(prog(t, 0, S("clash").start + 0.7)), { x0: 0.5, y0: 0.42, s0: 1.0, x1: 0.33, y1: 0.3, s1: 1.2 }, pJ);
    motes(ctx, t, 5, 46, 0.55 * pJ, { x: 0, y: 200, w: W, h: 900 });
    scrim(ctx, 900, 1920, 0.92 * pJ);
  }
  // cover frame (also the WhatsApp thumbnail): the question in gold
  const cov = 1 - eio(prog(t, 0.7, 1.5));
  if (cov > 0) { txt(ctx, "הָאָרֶץ שֶׁנִּשְׁאֲרָה", W / 2, 1260, 112, goldFill(ctx, 1260, 112, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: cov, glow: 30, stroke: "rgba(8,6,4,0.6)", strokeW: 10 }); txt(ctx, "יהושע י״ג–י״ד", W / 2, 1350, 46, C.cream, { w: 600, alpha: cov }); }

  // ===== verse of 13:1, written as it is spoken; it becomes the lower card of the clash
  const lift = eio(prog(t, Q.slam, Q.slam + 0.45)) * -110 + eio(prog(t, Q.slam + 0.45, Q.slam + 0.9)) * 70, shake = Math.sin(t * 90) * 14 * Math.exp(-Math.max(0, t - Q.slam - 0.42) * 6) * +(t > Q.slam + 0.42);
  const vB = (1 - eio(prog(t, S("key").start - 0.2, S("key").start + 0.35))), byB = 1230 + lift * +(t > Q.slam) + eio(prog(t, S("key").start - 0.2, S("key").start + 0.35)) * 700;
  if (t > Q.v1[0] - 0.3 && vB > 0) {
    card(ctx, W / 2 + shake, byB - 30, 900, 330, vis(t, S("clash").start + 0.2, S("key").start + 0.3, 0.5, 0.3), prog(t, S("clash").start + 0.2, S("clash").start + 1.2));
    const hiB = pulse(t, Q.q2, 1.4), tok = pulse(t, Q.v1[4] + 0.3, 1.6);
    verseLine(ctx, ["וְהָאָרֶץ", "נִשְׁאֲרָה"], Q.v1.slice(0, 2), t, W / 2 + shake, byB - 70, { px: 96, alpha: vB });
    verseLine(ctx, ["הַרְבֵּה־מְאֹד", "לְרִשְׁתָּהּ"], [Q.v1[2], Q.v1[4]], t, W / 2 + shake, byB + 50, { px: 96, alpha: vB, hi: { 0: hiB, 1: tok } });
    verseRef(ctx, "יהושע י״ג, א", W / 2 + shake, byB + 112, vB * prog(t, Q.v1[4] + 0.4, Q.v1[4] + 1.0));
  }
  // ===== CLASH: 11:16 against 13:1
  const vA = vis(t, Q.vA[0] - 0.3, S("key").start + 0.3, 0.3, 0.5), byA = 560 - lift * +(t > Q.slam) - eio(prog(t, S("key").start - 0.2, S("key").start + 0.35)) * 700;
  if (vA > 0) {
    card(ctx, W / 2 - shake, byA - 30, 900, 330, vA, prog(t, Q.vA[0] - 0.2, Q.vA[0] + 0.8));
    verseLine(ctx, ["וַיִּקַּח", "יְהוֹשֻׁעַ"], Q.vA.slice(0, 2), t, W / 2 - shake, byA - 70, { px: 96 });
    verseLine(ctx, ["אֶת", "כׇּל", "הָאָרֶץ"], Q.vA.slice(2), t, W / 2 - shake, byA + 50, { px: 96, hi: { 1: Math.max(pulse(t, Q.vA[3], 1.0), pulse(t, Q.q1, 1.3)) } });
    verseRef(ctx, "יהושע י״א, טז", W / 2 - shake, byA + 112, vA * prog(t, Q.vA[4] + 0.3, Q.vA[4] + 0.9));
  }
  // the impact flash and the question mark
  const flash = pulse(t, Q.slam + 0.42, 0.35); if (flash > 0) { ctx.save(); ctx.globalAlpha = flash * 0.35; ctx.fillStyle = C.goldHi; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const qm = eback(prog(t, Q.qmark + 0.2, Q.qmark + 0.7)) * (1 - eio(prog(t, S("key").start - 0.2, S("key").start + 0.2)));
  if (qm > 0) { ctx.save(); ctx.translate(W / 2, 870); ctx.scale(qm, qm); ctx.rotate(-0.06); txt(ctx, "?", 0, 95, 270, goldFill(ctx, 0, 330, t) as unknown as string, { w: 900, fam: FONT.verse, glow: 50, stroke: "rgba(8,6,4,0.85)", strokeW: 16 }); ctx.restore(); }

  // ===== KEY: to conquer / to inherit
  const kA = vis(t, Q.binNun - 0.1, S("conquest").start + 0.6, 0.4, 0.6);
  if (kA > 0) {
    chip(ctx, "הרב יואל בן נון", "מתוך 929 · תנ״ך ביחד", W / 2, 470, eout(prog(t, Q.binNun - 0.1, Q.binNun + 0.4)) * (1 - prog(t, Q.kibush - 0.3, Q.kibush + 0.2)));
    const dv = eio(prog(t, Q.between, Q.between + 0.6)) * (1 - prog(t, S("conquest").start - 0.3, S("conquest").start + 0.2)); if (dv > 0) { ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.shadowColor = C.gold; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(W / 2, 1000 - 260 * dv); ctx.lineTo(W / 2, 1000 + 260 * dv); ctx.stroke(); ctx.restore(); }
    // "to conquer" travels to its stamp position over the sea as the map arrives
    const go = eio(prog(t, S("conquest").start - 0.5, S("conquest").start + 0.4)), ka = eout(prog(t, Q.kibush - 0.1, Q.kibush + 0.35));
    const kx = lerp(805, 228, go), ky = lerp(960, 640, go), ks = lerp(1.3, 1, go);
    if (ka > 0 && t < S("conquest").start + 0.4) { ctx.save(); ctx.translate(kx, ky); ctx.scale(ks * (0.6 + 0.4 * ka), ks * (0.6 + 0.4 * ka)); txt(ctx, "לִכְבּוֹשׁ", 0, 0, 92, goldFill(ctx, 0, 92, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: ka, glow: 26 }); ctx.restore(); }
    // under it: one fast stroke
    const sw = eio(prog(t, Q.kibush + 0.15, Q.kibush + 0.55)) * (1 - go); if (sw > 0) { const r = smoothPath([[930, 1120], [800, 1080], [680, 1110]], 10); ctx.save(); ctx.globalAlpha = 1 - go; strokeAlong(ctx, r, sw, C.blood, 8, 14); const [x, y, a] = along(r, sw); arrowHead(ctx, x, y, a, 20, C.blood); ctx.restore(); }
    // "to inherit": slow, dot by dot
    const ha = eout(prog(t, Q.horish - 0.1, Q.horish + 0.35)) * (1 - eio(prog(t, S("conquest").start - 0.4, S("conquest").start + 0.2)));
    if (ha > 0) {
      txt(ctx, "לְהוֹרִישׁ", 275, 960, 92 * 1.3 * (0.6 + 0.4 * ha), goldFill(ctx, 960, 120, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: ha, glow: 26 });
      for (let i = 0; i < 15; i++) { const x = 175 + (i % 5) * 50, y = 1060 + Math.floor(i / 5) * 46, on = t > Q.horish + 0.3 + i * 0.12; ctx.save(); ctx.globalAlpha = ha * (on ? 1 : 0.25); ctx.fillStyle = on ? C.ember : C.goldLo; ctx.shadowColor = C.ember; ctx.shadowBlur = on ? 12 : 0; ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill(); ctx.restore(); }
    }
  }

  // ===== THE MAP (conquest ... breaks, finale)
  drawMap(ctx, env, t);
  stamp(ctx, "כִּיבּוּשׁ", vis(t, S("conquest").start + 0.3, Q.inh + 0.3, 0.01, 0.4), t);
  stamp(ctx, "הוֹרָשָׁה", vis(t, Q.inh, Q.threat + 0.3, 0.45, 0.5), t);
  stamp(ctx, "י״ב שבטים", vis(t, Q.everyTribe - 0.1, Q.lots, 0.4, 0.4) * mapAlpha(t), t, 640, 222, 0.78);
  stamp(ctx, "תוכנית", vis(t, Q.brk + 0.25, Q.reuben + 0.2, 0.4, 0.4), t);
  stamp(ctx, "מציאות", vis(t, Q.reuben, Q.caleb + 0.3, 0.4, 0.5), t);

  // ===== THREAT: the quiet danger (plate)
  const pH = vis(t, Q.threat - 0.2, Q.fromNow + 0.4, 0.8, 0.8);
  if (pH > 0) { plate(ctx, env, "highplaces", prog(t, Q.threat - 0.2, Q.fromNow + 0.4), { x0: 0.6, y0: 0.42, s0: 1.02, x1: 0.64, y1: 0.36, s1: 1.22 }, pH); motes(ctx, t, 17, 30, 0.6 * pH, { x: 450, y: 300, w: 400, h: 700 }, "255,170,90"); scrim(ctx, 1000, 1920, 0.9 * pH); }

  // ===== LOTS: chapter card, then Joshua and Eleazar
  const cc = vis(t, Q.lots - 0.1, Q.lots + 1.7, 0.35, 0.5);
  if (cc > 0) { ctx.save(); ctx.globalAlpha = cc; ctx.fillStyle = "rgba(10,8,6,0.9)"; ctx.fillRect(0, 0, W, H); ctx.restore(); const s = 1 + 0.06 * prog(t, Q.lots, Q.lots + 1.8); ctx.save(); ctx.translate(W / 2, 960); ctx.scale(s, s); txt(ctx, "פֶּרֶק י״ד", 0, 60, 190, goldFill(ctx, 0, 190, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: cc, glow: 40 }); ctx.restore(); ctx.save(); ctx.globalAlpha = cc; ctx.strokeStyle = C.gold; ctx.lineWidth = 2; const w = 320 * eio(prog(t, Q.lots, Q.lots + 0.8)); ctx.beginPath(); ctx.moveTo(W / 2 - w, 1090); ctx.lineTo(W / 2 + w, 1090); ctx.moveTo(W / 2 - w, 820); ctx.lineTo(W / 2 + w, 820); ctx.stroke(); ctx.restore(); txt(ctx, "נחלות השבטים", W / 2, 1160, 44, C.cream, { w: 600, alpha: cc * prog(t, Q.lots + 0.4, Q.lots + 1.0) }); }
  const pL = vis(t, Q.lots + 1.3, Q.spread + 0.5, 0.6, 0.8);
  if (pL > 0) { plate(ctx, env, "lots", prog(t, Q.lots + 1.3, Q.spread + 0.5), { x0: 0.5, y0: 0.45, s0: 1.05, x1: 0.55, y1: 0.5, s1: 1.25 }, pL); motes(ctx, t, 23, 24, 0.45 * pL, { x: 300, y: 700, w: 500, h: 600 }); scrim(ctx, 1000, 1920, 0.85 * pL); }

  // ===== PATTERN: the camp around the Tabernacle
  const cA = vis(t, Q.camp - 0.3, S("pattern").end - 0.4, 0.5, 0.6);
  chip(ctx, "הרב יובל שרלו", "ישיבת אורות שאול", W / 2, 400, eout(prog(t, Q.pat, Q.pat + 0.4)) * (1 - prog(t, Q.camp - 0.6, Q.camp - 0.1)));
  if (cA > 0) {
    const [cx, cy] = CAMP_C; ctx.save(); ctx.globalAlpha = cA; ctx.fillStyle = "rgba(10,8,6,0.6)"; ctx.beginPath(); ctx.roundRect(cx - 455, cy - 250, 910, 500, 20); ctx.fill(); ctx.strokeStyle = C.goldLo; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.shadowColor = C.gold; ctx.shadowBlur = 14; ctx.strokeRect(cx - 80, cy - 46, 160, 92); ctx.restore();
    txt(ctx, "המשכן", cx, cy + 12, 32, C.goldHi, { w: 800, alpha: cA }); txt(ctx, "מחנה השבטים · במדבר ב׳", cx, cy - 214, 26, C.cream, { w: 500, alpha: cA * 0.8 });
    txt(ctx, "מזרח", cx + 412, cy + 8, 22, C.goldLo, { w: 600, alpha: cA }); txt(ctx, "מערב", cx - 412, cy + 8, 22, C.goldLo, { w: 600, alpha: cA });
    const lit = (id: string) => Math.max(+(["judah", "ephraim", "manassehW"].includes(id)) * vis(t, Q.center - 0.1, Q.maids - 0.1, 0.25, 0.25), +(["dan", "naphtali", "gad", "asher"].includes(id)) * vis(t, Q.maids, Q.firsts - 0.1, 0.25, 0.25), +(["reuben", "gad", "manassehW", "dan"].includes(id)) * vis(t, Q.firsts, S("pattern").end, 0.25, 0.25));
    const anyLit = vis(t, Q.center - 0.1, S("pattern").end, 0.25, 0.25);
    TWELVE.forEach((id, i) => {
      const [dx, dy] = CAMP[id], a = cA * eback(prog(t, Q.camp + i * 0.07, Q.camp + 0.4 + i * 0.07)), L = lit(id); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = clamp(a) * (1 - 0.6 * anyLit * (1 - L)); ctx.translate(cx + dx, cy + dy); const s = 0.9 + 0.1 * clamp(a) + 0.12 * L; ctx.scale(s, s);
      ctx.fillStyle = tribeColor(id, 0.95, 34 + 14 * L, 45); ctx.strokeStyle = L > 0.1 ? C.goldHi : "rgba(248,226,160,0.55)"; ctx.lineWidth = 2 + 2 * L; ctx.shadowColor = C.gold; ctx.shadowBlur = 20 * L; ctx.beginPath(); ctx.roundRect(-74, -30, 148, 60, 12); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, tribe(id).he, cx + dx, cy + dy + 11, 32, C.cream, { w: 800, alpha: clamp(a) * (1 - 0.6 * anyLit * (1 - L)) });
      // lit tiles throw a thread down to their land
      if (L > 0.05) { const cam = mapCam(t), to = toScreen(cam, label(id)), from: XY = [cx + dx, cy + dy + 30]; ctx.save(); ctx.globalAlpha = L * 0.8; strokeAlong(ctx, flight(from, to, 0.1), eio(clamp(L)), "rgba(248,226,160,0.8)", 2.5, 10); ctx.restore(); }
    });
  }

  // ===== CALEB
  const pC = vis(t, Q.caleb - 0.2, Q.fin + 0.3, 0.8, 0.8);
  if (pC > 0) {
    plate(ctx, env, "caleb", eio(prog(t, Q.caleb - 0.2, Q.fin + 0.3)), { x0: 0.45, y0: 0.62, s0: 1.22, x1: 0.48, y1: 0.3, s1: 1.04 }, pC);
    motes(ctx, t, 31, 40, 0.5 * pC, { x: 0, y: 200, w: W, h: 1000 }); scrim(ctx, 880, 1920, 0.92 * pC);
    const ag = vis(t, Q.age - 0.1, Q.giants + 0.4, 0.3, 0.5);
    if (ag > 0) { const s = 0.85 + 0.15 * eback(prog(t, Q.age - 0.1, Q.age + 0.4)); ctx.save(); ctx.translate(W / 2, 1180); ctx.scale(s, s); txt(ctx, "85", 0, 0, 260, goldFill(ctx, 0, 260, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: ag, glow: 40 }); txt(ctx, "שָׁנָה", 0, 80, 54, C.cream, { w: 700, fam: FONT.verse, alpha: ag }); ctx.restore(); }
    const l1 = 1 - eio(prog(t, Q.heard - 0.3, Q.heard + 0.3)), l2 = 1 - eio(prog(t, Q.same - 0.4, Q.same + 0.1));
    verseLine(ctx, ["תְּנָה־לִּי", "אֶת־הָהָר", "הַזֶּה"], Q.give, t, W / 2, 1110, { px: 90, alpha: l1 * pC });
    verseLine(ctx, ["אוּלַי", "ה׳", "אוֹתִי", "וְהוֹרַשְׁתִּים"], [Q.give[2] + 0.35, Q.give[2] + 0.45, Q.give[2] + 0.55, Q.horashtim], t, W / 2, lerp(1250, 1290, 1 - l1), { px: 80, alpha: pC * l2, hi: { 3: pulse(t, Q.horashtim + 0.2, 1.2) } });
    verseRef(ctx, "יהושע י״ד, יב", W / 2, lerp(1250, 1290, 1 - l1) + 64, pC * l2 * prog(t, Q.horashtim + 0.3, Q.horashtim + 0.9));
    // the same root returns: לְרִשְׁתָּהּ from the opening line, above Caleb's וְהוֹרַשְׁתִּים, joined by י-ר-ש
    const back = eout(prog(t, Q.same - 0.3, Q.same + 0.5)) * pC;
    if (back > 0) {
      const glowT = 0.55 + 0.45 * Math.sin(t * 4);
      verseLine(ctx, ["לְרִשְׁתָּהּ"], [Q.same - 0.3], t, W / 2, lerp(940, 1010, back), { px: 104, alpha: back, hi: { 0: glowT } }); verseRef(ctx, "יהושע י״ג, א", W / 2, lerp(940, 1010, back) + 58, back);
      verseLine(ctx, ["וְהוֹרַשְׁתִּים"], [Q.same - 0.3], t, W / 2, lerp(1400, 1350, back), { px: 104, alpha: back, hi: { 0: glowT } }); verseRef(ctx, "יהושע י״ד, יב", W / 2, lerp(1400, 1350, back) + 58, back);
      const rt = eback(prog(t, Q.same + 0.4, Q.same + 0.9));
      if (rt > 0) {
        ctx.save(); ctx.globalAlpha = clamp(rt); ctx.strokeStyle = C.goldLo; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 1090); ctx.lineTo(W / 2, 1120); ctx.moveTo(W / 2, 1230); ctx.lineTo(W / 2, 1262); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(W / 2, 1195); ctx.scale(rt, rt); txt(ctx, "י · ר · ש", 0, 0, 70, C.goldHi, { w: 900, fam: FONT.verse, glow: 34 }); txt(ctx, "שׁוֹרֶשׁ אֶחָד", 0, 42, 28, C.cream, { w: 600, fam: FONT.verse }); ctx.restore();
      }
    }
  }

  // ===== FINALE: the plan is His, the choice is ours
  const f1 = eout(prog(t, Q.his - 0.05, Q.his + 0.45)), f2 = eout(prog(t, Q.ours - 0.05, Q.ours + 0.45)), fOut = 1 - eio(prog(t, Q.endCard, Q.endCard + 0.6));
  if (f1 > 0 && fOut > 0) {
    ctx.save(); ctx.globalAlpha = f1 * fOut; const g = ctx.createLinearGradient(0, 760, 0, 1160); g.addColorStop(0, "rgba(8,6,4,0)"); g.addColorStop(0.3, "rgba(8,6,4,0.75)"); g.addColorStop(0.7, "rgba(8,6,4,0.75)"); g.addColorStop(1, "rgba(8,6,4,0)"); ctx.fillStyle = g; ctx.fillRect(0, 760, W, 400); ctx.restore();
    txt(ctx, "הַתָּכְנִית — שֶׁלּוֹ.", W / 2, 900 + (1 - f1) * 30, 104, C.cream, { w: 900, fam: FONT.verse, alpha: f1 * fOut, glow: 14, glowColor: "rgba(0,0,0,0.8)" });
    txt(ctx, "הַבְּחִירָה — שֶׁלָּנוּ.", W / 2, 1060 + (1 - f2) * 30, 116, goldFill(ctx, 1060, 116, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: f2 * fOut, glow: 36 + 20 * pulse(t, Q.ours + 0.4, 1.2) });
  }
  const ec = eout(prog(t, Q.endCard + 0.2, Q.endCard + 0.9));
  if (ec > 0) {
    txt(ctx, "התנ״ך היומי", W / 2, 860, 96, goldFill(ctx, 860, 96, t) as unknown as string, { w: 900, fam: FONT.verse, alpha: ec, glow: 30 });
    txt(ctx, "יהושע י״ג–י״ד", W / 2, 950, 52, C.cream, { w: 600, alpha: ec });
    ctx.save(); ctx.globalAlpha = ec; ctx.strokeStyle = C.goldLo; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 200 * ec, 1010); ctx.lineTo(W / 2 + 200 * ec, 1010); ctx.stroke(); ctx.restore();
    txt(ctx, "על פי הרב יואל בן נון (929) והרב יובל שרלו", W / 2, 1080, 30, C.cream, { w: 500, alpha: ec * 0.85 });
    txt(ctx, "נוסח המקרא: ספריא · CC-BY-SA", W / 2, 1128, 26, C.cream, { w: 400, alpha: ec * 0.7 });
  }

  // ===== chrome: header, captions, grain
  const hd = (1 - vis(t, Q.lots - 0.1, Q.lots + 1.7, 0.3, 0.4)) * (1 - ec);
  header(ctx, t < Q.lots + 1 ? "יהושע · פרק י״ג" : "יהושע · פרק י״ד", hd);
  scrim(ctx, 1520, 1920, 0.8);
  drawCaption(ctx, CAPS, t, 1745, hideCaps);
  vignette(ctx, 0.55);
  grain(ctx, env, frame, 0.05);
  // fade out the very last half second to black
  const fo = prog(t, DUR - 0.6, DUR); if (fo > 0) { ctx.save(); ctx.globalAlpha = fo; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.restore(); }
};

// ---------------------------------------------------------------- film
const N = Math.round(DUR * FPS);
const shots: Shot[] = T.scenes.map((s, i) => ({ id: s.id, start: Math.round(s.start * FPS), end: i === T.scenes.length - 1 ? N : Math.round(T.scenes[i + 1].start * FPS), draw: (ctx, local, env) => draw(ctx, env, Math.round(s.start * FPS) + local) }));
export const film: Film = {
  meta: { title: "התנ״ך היומי · יהושע י״ג–י״ד", W, H, fps: FPS, bpm: 120, durationFrames: N, raster: "cpu" },
  assets: { images: { joshua: "plates/joshua_flare.jpg", highplaces: "plates/highplaces_flare.jpg", lots: "plates/lots_sun.jpg", caleb: "plates/caleb_flare.jpg" } },
  shots,
};
