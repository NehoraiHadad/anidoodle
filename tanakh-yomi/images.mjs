// node images.mjs <episodeDir> [--model flare|sunburst] [--only a,b] [--suffix x]
// Generates the AI "plates" listed in <episode>/plates.json through kie.ai GPT Image, 9:16 2K, no text.
import { readFileSync, mkdirSync, existsSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { kieTask } from "./lib/kie.mjs";
import { download } from "./lib/fal.mjs";
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ep = process.argv[2], model = `gpt-image-2-5-${arg("model", "flare")}-text-to-image`, only = arg("only")?.split(","), suffix = arg("suffix", "");
const spec = JSON.parse(readFileSync(join(ep, "plates.json"), "utf8")); mkdirSync(join(ep, "plates"), { recursive: true });
await Promise.all(Object.entries(spec.plates).filter(([k]) => !only || only.includes(k)).map(async ([name, scene]) => {
  const out = join(ep, "plates", `${name}${suffix}.jpg`); if (existsSync(out) && !process.argv.includes("--force")) return console.log(`${name}: exists`);
  const r = await kieTask(model, { prompt: `${scene}\n\n${spec.style}${spec.details ? "\nAccuracy requirements: " + spec.details.join("; ") + "." : ""}`, aspect_ratio: "9:16", resolution: "2K", background: "opaque" });
  const png = out.replace(/\.jpg$/, ".png"); await download(r.resultUrls[0], png);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-q:v", "2", out]); unlinkSync(png); console.log(`${name}: ${out}`); // 2K JPEG, ~1 MB: small enough to commit
}));
