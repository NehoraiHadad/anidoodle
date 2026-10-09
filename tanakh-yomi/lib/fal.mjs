// Thin fal.ai client: synchronous run with retries. Key from FAL_API_KEY (or FAL_KEY).
import { writeFileSync } from "node:fs";
const KEY = process.env.FAL_API_KEY ?? process.env.FAL_KEY;
export const falRun = async (endpoint, body, { tries = 4 } = {}) => {
  if (!KEY) throw new Error("FAL_API_KEY missing");
  for (let i = 1; ; i++) {
    try {
      const r = await fetch("https://fal.run/" + endpoint, { method: "POST", headers: { Authorization: "Key " + KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(`${endpoint} ${r.status}: ${(await r.text()).slice(0, 400)}`);
      return await r.json();
    } catch (e) { if (i >= tries) throw e; console.warn(`  retry ${i}: ${e.message}`); await new Promise((s) => setTimeout(s, 2000 * 2 ** i)); }
  }
};
export const download = async (url, path) => { const r = await fetch(url); if (!r.ok) throw new Error(`download ${r.status} ${url}`); writeFileSync(path, Buffer.from(await r.arrayBuffer())); return path; };
