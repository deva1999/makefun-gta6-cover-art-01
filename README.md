# Vice Nights — Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/deva1999/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/deva1999/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A free, offline web app that turns any photo and caption into GTA 6-style
cover art: the multi-panel poster look with bold condensed lettering and a
Vice City sunset or neon grade, exported as a PNG to share.

Built for the make.fun competition **gta6-cover-art-01** ("Make GTA 6 Cover
Art"). Referral code for the make.fun kit: **gx4yrk51**.

## What it does

- **Three photo panels** — each panel takes one of three built-in procedural
  scenes (Night Chase, Golden Boulevard, Sunset Heist) or a photo from your
  own machine, with per-panel zoom and position controls for cropping.
- **Fill all** — one click fills every panel with Panel 1's photo.
- **Three layouts** — hero-left, triple-strip, hero-top.
- **Three colour grades** — Sunset, Neon, Dusk, plus a vignette.
- **Editable caption and tagline** — big condensed lettering in
  Noto Sans Display Condensed Black, tagline in Bold.
- **PNG export** — one click exports 1920×1080, 1080×1080 or 1080×1350.

All artwork is drawn procedurally on canvas in `app/src/studio.js` — no
external images, no uploads, no network requests, no watermark. Your photos
never leave your machine.

## How to run it

Serve the `app/` folder with any static file server and open
`app/index.html` in a desktop browser (Chrome works well):

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

Or from the repository root with the included server:

```sh
node serve.ts
# open http://localhost:8080
```

1. Pick a layout and a colour grade.
2. Choose a scene or upload a photo for each panel; drag the zoom and
   position sliders to crop each one.
3. Type your caption and tagline.
4. Click an export button — the PNG downloads straight to your machine.

## Export sizes

- 1920×1080 — wide cover / desktop wallpaper
- 1080×1080 — square post
- 1080×1350 — portrait post

## Files

- `main.ts` — the make.fun program entry: copies `app/` and `screenshots/`
  to the output directory and writes `dossier.json`.
- `app/index.html`, `app/style.css`, `app/src/studio.js` — the app.
- `app/fonts/` — Noto Sans Display Condensed (Black + Bold) under the
  SIL Open Font License; see `app/fonts/OFL.txt`.
- `screenshots/` — the app in the browser and covers it exported.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.

## Handing in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That writes `out/dossier.json` from `app/` and `screenshots/`. Enter it
with the kit CLI; the kit referral code is **gx4yrk51**.

## License

MIT — see `LICENSE`. The fonts in `app/fonts/` are under the SIL Open
Font License 1.1 (`app/fonts/OFL.txt`). Original artwork only: no Rockstar
Games logo, artwork or fonts. Made with the make.fun kit — referral
**gx4yrk51** — and shared for GTA VI launch week. Referral code (once more,
for the template): **gx4yrk51**.
