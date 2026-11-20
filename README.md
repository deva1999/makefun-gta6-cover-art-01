# Vice Nights Cover Studio

An original multi-panel cover art maker inspired by big open-world game
covers. Build a poster from your own photos, grade it, caption it, and
export a print-ready PNG — entirely offline, in the browser.

## Run the app

Open `app/index.html` in desktop Chrome. There is no build step and the
app makes no network requests: every font, sample image and script is a
local file.

## What you can do

- Four photo panels. Click a panel to select it, then use the file picker
  or drag and drop a photo onto it.
- Fill every panel with a single photo, or give each panel its own photo.
- Drag inside a panel to reposition its photo; use the zoom slider to
  crop tighter or looser on the selected panel.
- Edit the main caption and the tagline — both are drawn onto the cover.
- Pick a colour grade: Sunset Warm, Neon Night or Dusky Haze.
- Export the finished cover as PNG at 1920x1080, 1080x1080 or 1080x1350.

Built-in sample scenes (a boulevard, a pier and a beach at dusk) are
drawn artwork generated for this project, so the studio looks alive
before you add any photos of your own. All artwork is original; no
third-party logos, fonts or artwork are used. The display type is
Noto Sans Display Condensed, licensed under the SIL Open Font License
1.1 (see `app/fonts/OFL.txt`).

## Build the dossier

    MAKEFUN_OUTPUT_DIR=./out node main.ts

This copies `app/` and `screenshots/` into the output directory and
writes a deterministic `dossier.json` there.
