// node music.mjs <episodeDir> [--seeds 11,23]
// An instrumental score whose sections follow the story: one ElevenLabs Music v2.5 composition-plan
// chunk per act (chunk `text` is lyrics, so it carries only a section name; the music is in the styles), each chunk exactly as long as its scenes (from timing.json). Writes audio/music_<seed>.mp3.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { falRun, download } from "./lib/fal.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ep = process.argv[2], seeds = arg("seeds", "11,23").split(",").map(Number);
const plan = JSON.parse(readFileSync(join(ep, "music.json"), "utf8")), timing = JSON.parse(readFileSync(join(ep, "timing.json"), "utf8"));
const at = (id) => (id === "end" ? timing.duration : timing.scenes.find((s) => s.id === id).start);
let t = 0; const chunks = plan.chunks.map((c) => { const end = at(c.until), ms = Math.round((end - t) * 1000); t = end; return { text: `[${c.section}] {instrumental}`, duration_ms: ms, positive_styles: [...plan.global_positive, ...c.styles, ...c.text.split(/\.\s*/).filter(Boolean).map((x) => x.slice(0, 120))], negative_styles: plan.global_negative, context_adherence: c.adherence ?? "medium" }; });
console.log(chunks.map((c) => `${(c.duration_ms / 1000).toFixed(1)}s`).join(" + "));
await Promise.all(seeds.map(async (seed) => { const r = await falRun("elevenlabs/music/v2.5", { composition_plan: { chunks }, seed, output_format: "mp3_48000_192" }); await download(r.audio.url, join(ep, "audio", `music_${seed}.mp3`)); console.log(`music_${seed}.mp3`); }));
