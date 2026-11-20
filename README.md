[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/deva1999/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/deva1999/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

# Vice Nights — Cover Studio

A web app that turns your photos into GTA-style multi-panel cover art, in the
spirit of GTA 6's posters: three photo panels, bold gradient caption lettering,
and a Vice City sunset or neon colour grade, exported as a PNG to share.

## What it does

- **Three panels, one poster.** A large hero panel on top and two panels below.
  Fill them with one photo or several: the two included sample photos
  (Boulevard, Pier) or any photo from your own machine.
- **Crop and position each photo.** Zoom and pan sliders per panel, or drag the
  photo right inside the poster.
- **Write the caption.** An editable bold title and subtitle, with size and
  colour-gradient controls.
- **Pick a grade.** Sunset, Neon, Dusk, and Mono colour grades, applied across
  the whole poster.
- **Post sizes.** Square 1080 × 1080, portrait 1080 × 1350, and wide
  1920 × 1080, with one-click export to PNG at full size.
- **Presets.** Three one-click starting points (Sunset Boulevard, Neon Pier,
  Dusk Mix) shown as a gallery under the poster.

## How to try it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Everything runs
offline from the static files under `app/` — no network requests, and photos
never leave your machine.

## How it is built

- `app/index.html` — the editor page: controls, poster canvas, preset gallery.
- `app/style.css` — the dark studio theme.
- `app/src/studio.js` — the whole app: one canvas routine draws the poster,
  exports the PNG, and paints the preset thumbnails.
- `app/fonts/` — Noto Sans Display Condensed (SIL Open Font License).
- `app/samples/` — two sample photos made for make.fun, free to use.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the
  output and writes `dossier.json` with the kit's `buildDossier`.

## License

MIT. See [LICENSE](LICENSE).
