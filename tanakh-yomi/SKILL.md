---
name: tanakh-yomi
description: Daily vertical motion-graphics film (1080x1920, ~110 s, under 16 MB for WhatsApp) for the "התנ״ך היומי" study group. Takes the day's message (two chapters + commentary), writes a narrated story, and renders it with painted AI plates, a code-drawn map, Hebrew type with niqqud, kinetic captions, a score and sound design. Sibling of anidoodle, which it uses as the motion layer.
metadata:
  built_on: anidoodle engine (engine/src/canvas-core/film.ts, hosts/page.ts, tools/adapters/playwright.mjs)
---

# tanakh-yomi

One film a day. **Paste the message → a finished MP4 + contact sheet.** The narration is the clock:
one TTS pass with character timestamps decides every cut and every cue, and the picture is a pure
function of the frame number (anidoodle's contract), so a re-render is identical.

The pilot is `episodes/2026-10-09/` (Joshua 13–14). Read its `film.ts` before writing a new one:
it shows every scene type below in use.

## The daily run

```bash
cd tanakh-yomi
E=episodes/<YYYY-MM-DD>; mkdir -p $E
# 1. paste the day's message into $E/message.md, then pull the sources
node fetch.mjs $E Joshua.15 Joshua.16          # Sefaria MAM text (niqqud), commentators per verse, Steinsaltz (for understanding only)
# 2. WRITE (this is the real work, see below): $E/script.json, $E/plates.json, $E/music.json, $E/film.ts
# 3. everything else, one command
node make.mjs $E                                # tts -> timing.json -> score + plates + sfx -> render -> out/
```

`make.mjs` skips steps whose output exists; `--only tts,render` re-runs some, `--force` re-runs all.
Single steps: `node tts.mjs $E [--reuse]`, `node images.mjs $E [--model flare|sunburst] [--only joshua]`,
`node music.mjs $E --seeds 58,37`, `node render.mjs $E --still 3,18.5,40` (stills at seconds), `node render.mjs $E`.

Keys come from the environment: `FAL_API_KEY` (voice, score, sound effects, transcription via fal.ai)
and `KIE_API_KEY` (GPT Image 2.5 via kie.ai). Check them by name only, never print values. Cost
of one day: ~4 plates on kie, one TTS pass, two score takes, one transcription pass.

## Who it is for, and what that means

A WhatsApp group that reads two chapters a day together. Phones, vertical, often mid-day, sometimes
muted. The film is **not** a lecture: it turns the day's commentary into one experience.

- **One question, one turn, one payoff.** Find the tension in the message (a contradiction between
  verses, a surprise, a "why"), open with it in the first 5 seconds, resolve it with the commentator's
  key, and end on one line people will repeat. The pilot: "כבשו הכול, או שנשאר הרבה מאוד?" →
  כיבוש vs. הורשה → "התוכנית שלו. הבחירה שלנו."
- **A token that returns.** A word, a shape, a place that appears at the start and pays off at the
  end. The pilot: the root י־ר־ש (לְרִשְׁתָּהּ in 13:1 → וְהוֹרַשְׁתִּים in Caleb's mouth, 14:12).
  Look for these in the text itself; they are the "wow" that is also true.
- **Add from the chapter itself when it completes the arc** (the pilot added Caleb, 14:6–15, who is
  not in the message but answers its question). Never add claims the sources do not support.
- **Narration voice:** a storyteller, not a lecturer. Short sentences, open questions, a pause before
  each reveal, energy up at the turn, warmth at the end. ~195 words ≈ 110 s.
- **Credit on screen**: the rabbis the message cites (as chips when their idea enters, and on the end
  card) and Sefaria (CC-BY-SA) for the text. Steinsaltz is copyrighted: use it to understand, paraphrase.
- **Sensitivities:** no depiction of God; figures from behind or in silhouette; no kitsch. Modern
  political analogies from a source (e.g. wars) are left out of the public film unless the user asks.

## Writing the four files

**`script.json`**: `voice` and `scenes[]`, each `{ id, say, plate? }`. `say` is what the narrator
reads. Rules: the Name is "השם" in `say` and "ה׳" on screen (fetch.mjs already swaps it in verses);
put niqqud on any word a reader could mispronounce or misread (לִכְבּוֹשׁ, הוֹרָשָׁה, הַבְּכוֹרִים vs.
ביכורים, שְׁכֶם, כָּלֵב) and on every quoted verse; write numbers as words ("פרק ארבעה עשר"); avoid
words with an unwanted modern sense. **Names of people always get full niqqud** as their owners
say them (הרב יובל שֶׁרְלוֹ, not שרלו, which the voice reads "Sharlo"); ask the user when unsure. Fix a
single scene without re-voicing the rest: edit its `say`, `node lib/patch-scene.mjs $E <sceneId>`, then
`node tts.mjs $E --reuse`. Avoid words with an unwanted modern sense ("סדר החניה" reads as parking: say "המחנה סביב המשכן").
Voice: ElevenLabs v4 via fal, `George` at stability 0.4 (chosen from a 3-voice test; Brian also
approved, Daniel rejected). `tts.mjs` speeds the read by 1.08 (pitch kept), puts every scene start on
the half-second grid, and writes `timing.json`. Then **always** check pronunciation without ears:
`node lib/stt-check.mjs $E/audio/raw.mp3` and compare the transcript with the script.

**`plates.json`**: a shared `style` (oil painting, Rembrandt chiaroscuro, indigo and gold, calm dark
lower third, no text) and 3–4 plates: the opening image, a mood beat, the climax. The map carries the
content; plates carry the feeling. Generate with both GPT Image 2.5 models when it matters
(`--model flare --suffix _flare`, `--model sunburst --suffix _sun`), look at them side by side
(Read the images), pick per plate, and point `film.ts` `assets.images` at the winners.

**Details pass on every plate (mandatory, the group notices).** Image models get period and ritual
details wrong with confidence. Before a plate goes in, crop and read it at full size against a
written list for that plate, and regenerate on any miss. Known failures from the pilot: the High
Priest's breastplate (choshen) painted on his BACK (it sits on the chest, tied to the ephod, onyx
stones on the shoulders, gold tzitz on the forehead, Exodus 28); a Late Bronze Age city drawn as a
crusader castle with crenellations and a church tower; elders drawn as hooded monks. So: name the
period in the prompt (Late Bronze / Iron Age), describe garments by their parts and where they sit,
list what must NOT appear (crenellations, arches, domes, Roman/medieval armour), and put shared
requirements in `plates.json` `details`. Also check: who would really be there (Eleazar was High
Priest by Joshua 14, Aaron had died), what they hold, how many of a counted thing (12 stones).

**`music.json`**: one chunk per act, `until` a scene id, with styles describing that act. Chunk text
is lyrics in this API, so it carries only a section name. Generate two seeds, then read the arc
without hearing it: `node lib/loudness.mjs $E/audio/music_*.mp3`. Pick the take that rises into the
payoff (the pilot's 58 climbs to -17 dB at the end; 11 and 23 sank to -40 and were dropped), copy it
to `audio/music.mp3`. It is mixed at 0.5 and side-chain ducked under the voice.

**`film.ts`**: the picture. Import the kit (`film/kit.ts`) and the land (`film/geo.ts`). Structure:
1. `Q`, a cue sheet: every visual event is `at(scene, word)`, the moment that word is spoken.
2. `QUIET`: time ranges where captions step aside (while a verse is being written on screen).
3. `sfx`: `{ t, name, gain }` from the shared library (`assets/sfx`, built by `sfx.mjs`).
4. one `draw(ctx, env, frame)` with layered sections gated by time; shots = scenes.

Scene vocabulary in the kit: `plate` (Ken Burns over a painting) + `motes` + `scrim`; `verseLine`
(a verse written word by word as it is spoken, with highlight pulses); `card` (gold-framed verse
card); `chip` (credit for a rabbi); `stamp` (one-word thesis over the sea); the map layer
(`baseMap` drawn in gold ink, `territory`/`tribeLabel` power-diagram allotments, `place`, routes with
`strokeAlong`/`arrowHead`, camera with `camLerp`); `drawCaption` (phrase captions, the word being
said lit in gold); `header`; `grain`/`vignette`. Frame 0 is a designed cover (painting + title):
WhatsApp uses it as the thumbnail.

## Checks before sending (you cannot hear it or watch it move)

1. `node render.mjs $E --still ...` at every scene's busiest moment; look at them; fix overlaps,
   unreadable type, empty frames. One look pass, then build the whole film.
2. Full render prints frame cost, determinism (hash of the same frames on another page, reversed
   order) and the file size; it must say "fits WhatsApp's 16 MB".
3. Read the contact sheet (one tile per 3 s): nothing blank, nothing stuck, every scene distinct.
4. Say plainly what was verified (transcript, stills, determinism, size, loudness) and what was not
   (how it sounds, how it moves). The user listens; that is the only real audio test.

## Map notes

`geo.ts` is a teaching map, approximate on purpose: coast, Kinneret, Jordan, Dead Sea from a dozen
real coordinates; the twelve allotments are a weighted Voronoi from estimated centres, clipped to
each bank. Fine for "who is where"; not a survey. Add places to `PLACES` as `[lat, lon]`. The frame
window is lat 30.9–33.75 with the map from y=170; the sea is on the left, a natural place for titles.
