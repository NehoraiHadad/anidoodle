// node lib/patch-scene.mjs <episodeDir> <sceneId>
// Re-voice ONE scene (after fixing its `say` in script.json, e.g. a name's niqqud) and splice it into
// audio/raw.mp3 + raw.timestamps.json at the pauses around it, so every other scene keeps its take.
// Then run `node tts.mjs <episodeDir> --reuse` to rebuild narration.wav and timing.json.
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { falRun, download } from "./fal.mjs";
const [ep, id] = process.argv.slice(2), A = join(ep, "audio"), script = JSON.parse(readFileSync(join(ep, "script.json"), "utf8")), v = script.voice;
const k = script.scenes.findIndex((s) => s.id === id); if (k < 0) throw new Error(`no scene ${id}`);
const SEP = "\n\n"; let text = ""; const ranges = script.scenes.map((s) => { const a = text.length; text += s.say; const r = [a, text.length]; text += SEP; return r; }); text = text.trimEnd();
const flat = (chunks) => chunks.reduce((o, c) => ({ characters: [...o.characters, ...c.characters], character_start_times_seconds: [...o.character_start_times_seconds, ...c.character_start_times_seconds], character_end_times_seconds: [...o.character_end_times_seconds, ...c.character_end_times_seconds] }), { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] });
const old = flat(JSON.parse(readFileSync(join(A, "raw.timestamps.json"), "utf8")));
// old scene range: the old say text may differ in length from the new one, so locate it by its neighbours
const oldText = old.characters.join(""), before = text.slice(0, ranges[k][0]), after = text.slice(ranges[k][1]);
if (!oldText.startsWith(before) || !oldText.endsWith(after)) throw new Error("other scenes changed too: re-run tts.mjs for the whole script");
const i0 = before.length, i1 = oldText.length - after.length, T0 = old.character_start_times_seconds, T1 = old.character_end_times_seconds;
const a = k ? (T1[i0 - 3] + T0[i0]) / 2 : 0, b = k < script.scenes.length - 1 ? (T1[i1 - 1] + T0[i1 + 2]) / 2 : T1.at(-1) + 0.3;
const r = await falRun(v.endpoint, { text: script.scenes[k].say, voice: v.voice, stability: v.stability, language_code: v.language_code, timestamps: true, output_format: "mp3_44100_192" });
await download(r.audio.url, join(A, `scene_${id}.mp3`)); const nw = flat(r.timestamps);
const pad = 0.12, s0 = nw.character_start_times_seconds[0], s1 = nw.character_end_times_seconds.at(-1), newLen = s1 - s0 + 2 * pad, delta = newLen - (b - a);
copyFileSync(join(A, "raw.mp3"), join(A, "raw.before-patch.mp3"));
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", join(A, "raw.before-patch.mp3"), "-i", join(A, `scene_${id}.mp3`), "-filter_complex",
  `[0:a]atrim=0:${a},asetpts=PTS-STARTPTS[x];[1:a]atrim=${s0}:${s1},asetpts=PTS-STARTPTS,adelay=${pad * 1000}|${pad * 1000},apad=pad_dur=${pad}[y];[0:a]atrim=${b},asetpts=PTS-STARTPTS[z];[x][y][z]concat=n=3:v=0:a=1[o]`,
  "-map", "[o]", "-ar", "44100", "-b:a", "192k", join(A, "raw.mp3")]);
const at = (arr, lo, hi, f) => arr.slice(lo, hi).map(f);
const out = {
  characters: [...old.characters.slice(0, i0), ...nw.characters, ...old.characters.slice(i1)],
  character_start_times_seconds: [...T0.slice(0, i0), ...nw.character_start_times_seconds.map((x) => x - s0 + a + pad), ...at(T0, i1, T0.length, (x) => x + delta)],
  character_end_times_seconds: [...T1.slice(0, i0), ...nw.character_end_times_seconds.map((x) => x - s0 + a + pad), ...at(T1, i1, T1.length, (x) => x + delta)],
};
if (out.characters.join("") !== text) console.warn("spliced text differs from script (the model normalised something); tts.mjs aligns by index");
writeFileSync(join(A, "raw.timestamps.json"), JSON.stringify([out]));
console.log(`scene ${id}: ${(b - a).toFixed(2)} s -> ${newLen.toFixed(2)} s (${delta >= 0 ? "+" : ""}${delta.toFixed(2)} s). Now: node tts.mjs ${ep} --reuse`);
