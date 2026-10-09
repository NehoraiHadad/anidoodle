---
name: tanakh-yomi
description: Make the day's "התנ״ך היומי" video. Use when the user pastes the daily Tanakh-study message (two chapters plus commentary), asks for today's video, or asks to fix one (a pronunciation, a picture, a scene). Produces a vertical ~110 s MP4 under 16 MB for WhatsApp, plus a contact sheet.
---

# התנ״ך היומי: from the daily message to a video

The full craft guide is `tanakh-yomi/SKILL.md`. Read it completely before starting; this file is
only the entry point and the order of work.

1. **Keys**: check that `FAL_API_KEY` and `KIE_API_KEY` exist (names only, never print values).
2. **Sources**: `E=tanakh-yomi/episodes/<YYYY-MM-DD>`, save the user's message to `$E/message.md`,
   then `node tanakh-yomi/fetch.mjs $E <Book.Ch> <Book.Ch>`.
3. **Write** `$E/script.json`, `$E/plates.json`, `$E/music.json`, `$E/film.ts`, using
   `tanakh-yomi/episodes/2026-10-09/` as the worked example (study it, do not copy it).
   One question, one turn, one payoff, one returning token; credit the rabbis; full niqqud on
   names and on any word that could be misread.
4. **Produce**: `node tanakh-yomi/make.mjs $E`, then the checks: pronunciation transcript
   (`lib/stt-check.mjs`), a details pass on every plate at full size, stills of the busiest
   moments, the contact sheet, the size line.
5. **Deliver**: send the MP4 and contact sheet, say what was verified and what was not (sound and
   motion are the user's to judge), then commit and push.

Fixes after delivery: one scene's wording or a name → `lib/patch-scene.mjs` + `tts.mjs --reuse`;
a picture → edit `plates.json`, `images.mjs --only <plate>`, check details; then `render.mjs`.
