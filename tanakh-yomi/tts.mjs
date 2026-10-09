// node tts.mjs <episodeDir> [--gap 0.55]
// One TTS call for the whole script (continuous prosody), with character timestamps. Then the
// audio is cut at scene boundaries and a breath of silence is inserted between scenes so the
// picture has room to land. Writes audio/narration.wav and timing.json (scenes + words, seconds).
// The narration is the clock: every visual cue in the film is derived from timing.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { falRun, download } from "./lib/fal.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ep = process.argv[2], gap = Number(arg("gap", 0.25)), tempo = Number(arg("tempo", 1.08)), lead = 0.8, tail = 3.4;
const script = JSON.parse(readFileSync(join(ep, "script.json"), "utf8")), v = script.voice, A = join(ep, "audio"); mkdirSync(A, { recursive: true });
// Scenes are joined with a blank line; their character ranges in the joined text map timestamps back to scenes.
const SEP = "\n\n"; let text = ""; const ranges = script.scenes.map((s) => { const a = text.length; text += s.say; const r = [a, text.length]; text += SEP; return r; }); text = text.trimEnd();

if (!process.argv.includes("--reuse")) {
  const r = await falRun(v.endpoint, { text, voice: v.voice, stability: v.stability, language_code: v.language_code, timestamps: true, output_format: "mp3_44100_192" });
  await download(r.audio.url, join(A, "raw.mp3")); writeFileSync(join(A, "raw.timestamps.json"), JSON.stringify(r.timestamps));
}
// a touch faster than the model's default read: tighter, more trailer-like, pitch kept (atempo)
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(A, "raw.mp3"), "-af", `atempo=${tempo}`, "-ar", "48000", join(A, "raw_t.wav")]);
const chunks = JSON.parse(readFileSync(join(A, "raw.timestamps.json"), "utf8")).map((c) => ({ ...c, character_start_times_seconds: c.character_start_times_seconds.map((x) => x / tempo), character_end_times_seconds: c.character_end_times_seconds.map((x) => x / tempo) }));
const chars = [], t0s = [], t1s = []; for (const c of chunks) { chars.push(...c.characters); t0s.push(...c.character_start_times_seconds); t1s.push(...c.character_end_times_seconds); }
if (chars.join("") !== text) console.warn(`timestamps text differs from request (${chars.length} vs ${text.length} chars): aligning by index`);
// words with times, tagged by scene
const words = []; let cur = null;
for (let i = 0; i < chars.length; i++) {
  const ch = chars[i], scene = ranges.findIndex(([a, b]) => i >= a && i < b);
  if (/\s/.test(ch) || scene < 0) { if (cur) { words.push(cur); cur = null; } continue; }
  if (!cur) cur = { w: "", t0: t0s[i], t1: t1s[i], scene }; cur.w += ch; cur.t1 = t1s[i];
}
if (cur) words.push(cur);
// scene windows in the raw audio, cut points midway through the pause between scenes
const raw = script.scenes.map((_, k) => { const ws = words.filter((w) => w.scene === k); return [ws[0].t0, ws.at(-1).t1]; });
const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(A, "raw_t.wav")]).toString());
const cuts = raw.map((r, k) => (k === 0 ? 0 : (raw[k - 1][1] + r[0]) / 2)); cuts.push(dur);
// new timeline: lead-in, each scene's slice, a gap between scenes, a tail for the end card
const scenes = []; let t = lead; const filters = [], labels = [];
script.scenes.forEach((s, k) => {
  const a = cuts[k], b = cuts[k + 1], shift = t - a;
  scenes.push({ id: s.id, start: k === 0 ? 0 : t, speechStart: raw[k][0] + shift, speechEnd: raw[k][1] + shift, end: 0 });
  words.filter((w) => w.scene === k).forEach((w) => { w.t0 = +(w.t0 + shift).toFixed(3); w.t1 = +(w.t1 + shift).toFixed(3); });
  filters.push(`[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS[s${k}]`); labels.push(`[s${k}]`);
  // the next scene starts on the half-second grid (a 15-frame beat at 30 fps): gap is at least `gap`
  t += b - a; scenes[k].pad = k < script.scenes.length - 1 ? +(Math.ceil((t + gap) * 2) / 2 - t).toFixed(4) : 0; t += scenes[k].pad;
});
scenes.forEach((s, k) => (s.end = k < scenes.length - 1 ? scenes[k + 1].start : t + tail));
const total = t + tail;
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(A, "raw_t.wav"), "-filter_complex",
  `${filters.join(";")};${script.scenes.map((_, k) => `[s${k}]apad=pad_dur=${scenes[k].pad}[p${k}]`).join(";")};${script.scenes.map((_, k) => `[p${k}]`).join("")}concat=n=${script.scenes.length}:v=0:a=1,adelay=${lead * 1000}|${lead * 1000},apad=pad_dur=${tail},aresample=48000[out]`,
  "-map", "[out]", "-ac", "2", join(A, "narration.wav")]);
writeFileSync(join(ep, "timing.json"), JSON.stringify({ duration: +total.toFixed(3), scenes, words: words.map(({ w, t0, t1, scene }) => ({ w, t0, t1, scene: script.scenes[scene].id })) }, null, 1));
console.log(`narration ${dur.toFixed(1)} s raw -> ${total.toFixed(1)} s film`); scenes.forEach((s) => console.log(`  ${s.id.padEnd(9)} ${s.start.toFixed(2)} -> ${s.end.toFixed(2)}  speech ${s.speechStart.toFixed(2)}-${s.speechEnd.toFixed(2)}`));
