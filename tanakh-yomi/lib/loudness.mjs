// node lib/loudness.mjs <audio...>  -> RMS (dBFS) every 3 s, to read a score's arc without hearing it.
// A good take rises into the payoff; a take that sinks below -30 dB in its last act lost its climax.
import { execFileSync } from "node:child_process";
for (const f of process.argv.slice(2)) {
  const b = execFileSync("ffmpeg", ["-loglevel", "error", "-i", f, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], { maxBuffer: 1 << 28 }), x = new Int16Array(b.buffer, b.byteOffset, b.length >> 1), out = [];
  for (let s = 0; s + 3 * 8000 <= x.length; s += 3 * 8000) { let e = 0; for (let i = s; i < s + 24000; i++) e += (x[i] / 32768) ** 2; out.push(Math.round(10 * Math.log10(e / 24000 + 1e-12))); }
  console.log(`${f}\n  ${out.join(" ")}`);
}
