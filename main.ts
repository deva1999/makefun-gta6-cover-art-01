import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// Vice Nights Cover Studio — entrypoint. Hands the app in: copies app/ and
// screenshots/ from this repository to the output directory and writes the
// dossier that buildDossier produces from them, byte for byte.
const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// The gate's caps for this competition: 160 KiB of dossier text, a 1.5 MiB
// dossier, at most 4 screenshots, app/index.html at most 1 MiB, app/ at most
// 993 entries and 48 MiB, every path at most 1,000 bytes.
const caps = {
  text_max_bytes: 163840,
  dossier_max_bytes: 1572864,
  max_images: 4,
  index_html_max_bytes: 1048576,
  app_max_bytes: 50331648,
  app_max_files: 993,
  path_max_bytes: 1000,
};

// Fail fast with a plain error when the entry is incomplete, instead of
// handing the grader an empty app or a dossier with no screenshots.
async function requireEntry() {
  const index = path.join(repoRoot, "app", "index.html");
  const indexStat = await stat(index).catch(() => null);
  if (!indexStat || !indexStat.isFile()) {
    throw new Error(`entry incomplete: ${index} is missing`);
  }
  const shots = await readdir(path.join(repoRoot, "screenshots")).catch(() => []);
  const images = shots.filter((name) => /\.(png|jpe?g)$/i.test(name) && !name.startsWith("."));
  if (images.length < 3 || images.length > 4) {
    throw new Error(`entry incomplete: expected 3 or 4 screenshots, found ${images.length}`);
  }
  return images;
}

const shotNames = await requireEntry();
await rm(outDir, { recursive: true, force: true });
await mkdir(path.join(outDir, "app"), { recursive: true });
await mkdir(path.join(outDir, "screenshots"), { recursive: true });
await cp(path.join(repoRoot, "app"), path.join(outDir, "app"), { recursive: true });
await cp(path.join(repoRoot, "screenshots"), path.join(outDir, "screenshots"), { recursive: true });
const dossier = await buildDossier(outDir, caps);
await writeFile(path.join(outDir, "dossier.json"), dossier);
console.log(`handed in ${shotNames.length} screenshots (${shotNames.join(", ")})`);
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
