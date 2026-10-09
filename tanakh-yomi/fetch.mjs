// node fetch.mjs <episodeDir> Joshua.13 Joshua.14 [--hatanakh 6.13.0]
// Pulls the raw material for a day's script into <episode>/sources/:
//   <ref>.he.json      the chapter, MAM text (CC-BY-SA), niqqud kept, cantillation stripped, plus a plain copy
//   <ref>.links.json   which commentators Sefaria links per verse (Rashi, Metzudat David, Ralbag, Abarbanel, Steinsaltz...)
//   <ref>.steinsaltz.json  Steinsaltz's explanation, FOR UNDERSTANDING ONLY (copyright Steinsaltz Center: paraphrase, never quote at length)
//   hatanakh.html      the hatanakh.com daily page, when its numeric chapter id is given (ids are not Sefaria refs)
// The day's own WhatsApp message stays the primary source; paste it into <episode>/message.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2), ep = args[0], hi = args.indexOf("--hatanakh"), ht = hi > 0 ? args[hi + 1] : null;
const refs = args.slice(1).filter((a, i) => !a.startsWith("--") && args[i] !== "--hatanakh");
const out = join(ep, "sources"); mkdirSync(out, { recursive: true });
const get = async (url) => { for (let i = 1; ; i++) { try { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r; } catch (e) { if (i >= 4) throw e; await new Promise((s) => setTimeout(s, 1000 * 2 ** i)); } } };
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/[֑-ֽ֯׀׃]/g, "").replace(/\{[פס]\}/g, "").trim(); // drop cantillation, keep niqqud
const plain = (s) => strip(s).replace(/[ְ-ׇ]/g, "");
const ONE_NAME = /יְהֹוָה|יְהוָה|יהוה/g; // the Name: say "השם", show "ה׳"
for (const ref of refs) {
  const v = (await (await get(`https://www.sefaria.org/api/v3/texts/${ref}?version=hebrew`)).json()).versions[0];
  const verses = v.text.map((t, i) => ({ n: i + 1, he: strip(t).replace(ONE_NAME, "ה׳"), plain: plain(t).replace(/יהוה/g, "ה׳") }));
  writeFileSync(join(out, `${ref}.he.json`), JSON.stringify({ ref, version: v.versionTitle, license: v.license, verses }, null, 1));
  const links = [];
  for (const { n } of verses) { const d = await (await get(`https://www.sefaria.org/api/related/${ref}.${n}`)).json(); links.push({ n, commentators: [...new Set(d.links.filter((l) => l.category === "Commentary").map((l) => l.collectiveTitle?.he ?? l.collectiveTitle?.en))] }); }
  writeFileSync(join(out, `${ref}.links.json`), JSON.stringify(links, null, 1));
  const [book, ch] = ref.split(".");
  const st = await get(`https://www.sefaria.org/api/v3/texts/Steinsaltz_on_${book}.${ch}`).then((r) => r.json()).catch(() => null);
  if (st?.versions?.[0]) writeFileSync(join(out, `${ref}.steinsaltz.json`), JSON.stringify({ note: "Copyright Steinsaltz Center: for understanding only. Paraphrase; do not quote at length.", text: st.versions[0].text.map((x) => strip(Array.isArray(x) ? x.join(" ") : x)) }, null, 1));
  console.log(`${ref}: ${verses.length} verses`);
}
if (ht) { writeFileSync(join(out, "hatanakh.html"), await (await get(`https://www.hatanakh.com/daily?chapter=${ht}`)).text()); console.log("hatanakh.html"); }
