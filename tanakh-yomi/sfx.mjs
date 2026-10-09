// node sfx.mjs  -> builds the shared sound-effect library in assets/sfx (ElevenLabs SFX v2 via fal). Skips existing files.
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { falRun, download } from "./lib/fal.mjs";
const LIB = {
  whoosh_soft: ["soft cinematic air whoosh transition, smooth, no impact", 1.2],
  whoosh_fast: ["fast sharp arrow whoosh passing by", 0.8],
  ink_scratch: ["quill pen scratching on thick parchment, drawing a long line, close and dry", 2.5],
  drum_hit: ["single deep cinematic taiko drum hit with short natural decay", 2],
  impact_clash: ["two heavy stone slabs colliding, deep cinematic impact, short", 1.5],
  ember_pop: ["tiny soft ember crackle pop, single, quiet", 0.5],
  stone_click: ["small smooth stone dropped into a clay urn, single click and rattle", 0.8],
  shimmer: ["soft warm golden shimmer chime, gentle magical sparkle, short", 2],
  parchment_unroll: ["old parchment map being unrolled on a wooden table", 1.6],
  riser: ["low cinematic tension riser building to a stop, no impact", 3],
  page_turn: ["single heavy old book page turn", 1],
};
const DIR = join(dirname(fileURLToPath(import.meta.url)), "assets/sfx"); mkdirSync(DIR, { recursive: true });
await Promise.all(Object.entries(LIB).map(async ([name, [text, d]]) => {
  const out = join(DIR, `${name}.mp3`); if (existsSync(out)) return;
  const r = await falRun("fal-ai/elevenlabs/sound-effects/v2", { text, duration_seconds: d, prompt_influence: 0.6 });
  await download(r.audio.url, out); console.log(out);
}));
