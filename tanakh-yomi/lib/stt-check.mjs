// node lib/stt-check.mjs <audio>  -> transcript via ElevenLabs Scribe (fal), for a pronunciation sanity pass
import { readFileSync } from "node:fs";
import { falRun } from "./fal.mjs";
const f = process.argv[2], mime = f.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
const r = await falRun("fal-ai/elevenlabs/speech-to-text/scribe-v2", { audio_url: `data:${mime};base64,${readFileSync(f).toString("base64")}`, language_code: "heb" });
console.log(r.text);
