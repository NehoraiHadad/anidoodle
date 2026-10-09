// node render.mjs <episodeDir> [--still 3.2,18,40] [--workers 4] [--from s --to s] [--no-audio]
// Builds ONE self-contained page (episode film + anidoodle engine host + fonts + plates inlined),
// renders it frame by frame through the engine's Playwright adapter, then mixes narration, score
// and sound effects (music ducked under the voice) into an H.264/AAC MP4 sized for WhatsApp,
// plus a contact sheet. --still writes PNGs at the given seconds instead (the look check).
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url)), ENGINE = resolve(HERE, "../engine");
const req = createRequire(join(ENGINE, "package.json")), { build } = req("esbuild");
const { findBrowser } = await import(join(ENGINE, "tools/detect.mjs")), playwright = await import(join(ENGINE, "tools/adapters/playwright.mjs"));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const EP = resolve(process.argv[2]), OUT = join(EP, "out"), TMP = join(EP, ".tmp"); mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true });
const slug = EP.split("/").pop();

// ---- plates: 2K PNGs -> 1216x2160 JPEG (cover for 1080x1920 with room for Ken Burns)
const film0 = await probe();
const assets = {};
for (const [name, file] of Object.entries(film0.assets.images)) {
  const src = join(EP, file), jpg = join(TMP, `${name}.jpg`);
  if (!existsSync(jpg) || statSync(jpg).mtimeMs < statSync(src).mtimeMs) execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", "scale=1216:2160:force_original_aspect_ratio=increase,crop=1216:2160", "-q:v", "3", jpg]);
  assets[name] = "data:image/jpeg;base64," + readFileSync(jpg).toString("base64");
}
// ---- fonts, inlined
const F = (f) => `data:font/woff2;base64,${readFileSync(join(HERE, "assets/fonts", f)).toString("base64")}`;
const faces = [["Frank Ruhl Libre", "FrankRuhlLibre"], ["Heebo", "Heebo"]].flatMap(([fam, f]) => [["hebrew", "U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F"], ["latin", "U+0000-00FF, U+2000-206F"]].map(([sub, range]) => `@font-face{font-family:"${fam}";font-weight:300 900;src:url(${F(`${f}-${sub}.woff2`)}) format("woff2");unicode-range:${range};}`)).join("\n");
// ---- page
const entry = `import { mountFilm } from ${JSON.stringify(join(ENGINE, "src/hosts/page.ts"))};
import { film } from ${JSON.stringify(join(EP, "film.ts"))};
const fonts = Promise.all(["500","700","800","900"].flatMap((w) => [document.fonts.load(w + ' 60px "Frank Ruhl Libre"', "אָבג"), document.fonts.load(w + ' 60px "Heebo"', "אבג")]));
mountFilm(film); const F = (window as any).FILM; F.ready = Promise.all([F.ready, fonts]).then(() => F.meta);`;
const js = (await build({ stdin: { contents: entry, resolveDir: HERE, loader: "ts" }, bundle: true, format: "iife", target: "es2022", minify: true, write: false, legalComments: "none" })).outputFiles[0].text;
const page = join(TMP, "page.html");
writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"><title>${film0.meta.title}</title><style>${faces}\nhtml,body{margin:0;background:#000;display:grid;place-items:center;height:100%}canvas{max-height:100vh;aspect-ratio:9/16}</style></head><body><canvas id="film"></canvas><script>window.__ASSETS__=${JSON.stringify(assets)};</script><script>${js.replace(/<\/script/g, "<\\/script")}</script></body></html>`);
console.log(`page ${(statSync(page).size / 1e6).toFixed(1)} MB, ${film0.meta.durationFrames} frames, ${film0.sfx.length} sound cues`);

const lib = req("playwright-core"), browser = findBrowser(lib);
const fps = film0.meta.fps, N = film0.meta.durationFrames;

if (arg("still")) {
  const s = await playwright.open({ pw: { lib }, browser }, page, { workers: 1 });
  for (const sec of arg("still").split(",").map(Number)) { const f = await s.frame(Math.round(sec * fps), 0), out = join(OUT, `still-${String(sec).replace(".", "_")}s.png`); writeFileSync(out, f.png); console.log(`${out}  draw ${f.drawMs.toFixed(0)} ms`); }
  await s.close(); process.exit(0);
}

// ---- frames -> silent video
const workers = Number(arg("workers", Math.max(1, Math.min(6, cpus().length)))), from = Math.round(Number(arg("from", 0)) * fps), to = Math.min(N, Math.round(Number(arg("to", N / fps)) * fps));
const silent = join(TMP, "video.mp4"), t0 = Date.now();
const session = await playwright.open({ pw: { lib }, browser }, page, { workers });
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "12", "-preset", "fast", silent], { stdio: ["pipe", "inherit", "inherit"] });
const done = new Promise((r, j) => ff.on("close", (c) => (c ? j(new Error("ffmpeg " + c)) : r())));
const pending = new Map(); let next = from, write = from, slow = 0;
const pump = async () => { while (pending.has(write)) { const b = pending.get(write); pending.delete(write); if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once("drain", r)); write++; if (write % 150 === 0) process.stdout.write(`  ${(write / fps).toFixed(0)}s/${(to / fps).toFixed(0)}s  (${((Date.now() - t0) / 1000).toFixed(0)} s)\n`); } };
await Promise.all(Array.from({ length: session.workers }, async (_, w) => { while (next < to) { const n = next++; while (n - write > session.workers * 3) await new Promise((r) => setTimeout(r, 5)); const f = await session.frame(n, w); if (f.drawMs > 150) slow++; pending.set(n, f.png); await pump(); } }));
await pump(); ff.stdin.end(); await done;
// determinism probe: same frames, other page, reverse order
const probeF = [0, Math.floor(N / 3), Math.floor(N / 2), N - 1].filter((n) => n >= from && n < to), fwd = [], rev = [];
for (const n of probeF) fwd.push(await session.hash(n, 0)); for (const n of [...probeF].reverse()) rev.unshift(await session.hash(n, session.workers - 1));
await session.close();
console.log(`frames: ${to - from} in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${slow} over the 150 ms draw budget; determinism ${probeF.filter((_, i) => fwd[i] === rev[i]).length}/${probeF.length}`);

// ---- audio: narration + ducked score + sound effects
const final = join(OUT, `tanakh-yomi-${slug}.mp4`), A = join(EP, "audio");
const music = film0.music ? join(A, film0.music) : null, narr = join(A, "narration.wav");
const inputs = ["-i", silent, "-i", narr, ...(music ? ["-i", music] : [])], fx = [];
const sfxBase = music ? 3 : 2;
film0.sfx.forEach((s) => inputs.push("-i", join(HERE, "assets/sfx", `${s.name}.mp3`)));
film0.sfx.forEach((s, i) => fx.push(`[${sfxBase + i}:a]aresample=48000,volume=${s.gain},adelay=${Math.round(s.t * 1000)}|${Math.round(s.t * 1000)}[x${i}]`));
const dur = (N / fps).toFixed(3);
const graph = [
  `[1:a]aresample=48000,loudnorm=I=-16:TP=-1.5:LRA=9,asplit=2[voice][key]`,
  ...(music ? [`[2:a]aresample=48000,volume=${film0.musicGain ?? 0.55},afade=t=out:st=${(N / fps - 2.5).toFixed(2)}:d=2.5[m0]`, `[m0][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450:makeup=1[bed]`] : []),
  ...fx,
  `[voice]${music ? "[bed]" : ""}${film0.sfx.map((_, i) => `[x${i}]`).join("")}amix=inputs=${1 + (music ? 1 : 0) + film0.sfx.length}:normalize=0:duration=first,atrim=0:${dur},alimiter=limit=0.89[mix]`,
].join(";");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", graph, "-map", "0:v", "-map", "[mix]", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "1000k", "-bufsize", "2000k", "-pix_fmt", "yuv420p", "-profile:v", "high", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", dur, final]);
const mb = statSync(final).size / 1e6;
console.log(`\n${final}: ${mb.toFixed(1)} MB ${mb <= 16 ? "(fits WhatsApp's 16 MB)" : "(OVER 16 MB)"}`);
// contact sheet: one tile every 3 seconds
const sheet = join(OUT, `contact-${slug}.jpg`), cols = 8, every = 3, rows = Math.ceil(N / fps / every / cols);
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", final, "-vf", `fps=1/${every},scale=216:-1,drawtext=text='%{pts\\:hms}':x=6:y=6:fontcolor=white:fontsize=14:box=1:boxcolor=black@0.5,tile=${cols}x${rows}:padding=4:color=black`, "-frames:v", "1", "-q:v", "3", sheet]);
console.log(sheet);

async function probe() {
  const src = `export { film, sfx, music, musicGain } from ${JSON.stringify(join(EP, "film.ts"))};`;
  const code = (await build({ stdin: { contents: src, resolveDir: HERE, loader: "ts" }, bundle: true, format: "esm", platform: "neutral", write: false })).outputFiles[0].text;
  const m = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
  return { ...m.film, sfx: m.sfx ?? [], music: m.music, musicGain: m.musicGain };
}
