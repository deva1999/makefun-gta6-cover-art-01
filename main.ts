// Vice Nights — Cover Studio, handed in for gta6-cover-art-01 (Node 22, standard
// library only). The program copies the static app (app/) and the maker's
// screenshots (screenshots/) into the output directory, then writes the dossier
// the judge reads with the kit's vendored library. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output, so a local run looks like:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function handIn() {
  mkdirSync(outputDir, { recursive: true });

  const appDir = join(repoRoot, "app");
  cpSync(appDir, join(outputDir, "app"), { recursive: true });

  const shotDir = join(repoRoot, "screenshots");
  const shotOut = join(outputDir, "screenshots");
  mkdirSync(shotOut, { recursive: true });
  if (existsSync(shotDir)) cpSync(shotDir, shotOut, { recursive: true });

  // The scorer's own caps, as the competition's gate states them: the dossier
  // text is capped, at most four screenshots, each within 256 KiB, and app/
  // within its file and byte caps beside the output's own entry cap.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, "dossier.json"), dossier);
}

handIn();
