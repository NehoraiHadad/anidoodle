// node make.mjs <episodeDir> [--only tts,music,images,sfx,render] [--force]
// The whole day after the writing is done: narration -> (score, plates, sound library) -> render.
// Needs in <episodeDir>: script.json, plates.json, music.json, film.ts (see SKILL.md).
// Each step is skipped when its output already exists, unless --force or named in --only.
import { existsSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url)), ep = process.argv[2], arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : null; };
const only = arg("only")?.split(","), force = process.argv.includes("--force"), want = (s, out) => (only ? only.includes(s) : force || !existsSync(join(ep, out)));
const run = (f, ...a) => { console.log(`\n== ${f} ${a.join(" ")}`); execFileSync("node", [join(HERE, f), ...a], { stdio: "inherit" }); };
const runBg = (f, ...a) => new Promise((res, rej) => { import("node:child_process").then(({ spawn }) => { const p = spawn("node", [join(HERE, f), ...a], { stdio: "inherit" }); p.on("close", (c) => (c ? rej(new Error(`${f} exited ${c}`)) : res())); }); });

if (!ep || !existsSync(join(ep, "script.json"))) { console.error("usage: node make.mjs <episodeDir>   (episodeDir/script.json is required)"); process.exit(1); }
if (want("tts", "timing.json")) run("tts.mjs", ep);
// the score is timed from timing.json, so it follows the narration; plates and sfx are independent
await Promise.all([
  want("music", "audio/music_58.mp3") && !existsSync(join(ep, "audio/music.mp3")) ? runBg("music.mjs", ep, "--seeds", "58,37") : null,
  want("images", "plates") ? runBg("images.mjs", ep) : null,
  !only || only.includes("sfx") ? runBg("sfx.mjs") : null, // cheap: skips files that exist
]);
if (!existsSync(join(ep, "audio/music.mp3")) && existsSync(join(ep, "audio/music_58.mp3"))) { copyFileSync(join(ep, "audio/music_58.mp3"), join(ep, "audio/music.mp3")); console.log("score: music_58 (compare takes with the loudness check in SKILL.md)"); }
if (!only || only.includes("render")) run("render.mjs", ep);
