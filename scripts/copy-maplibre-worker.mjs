import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = join(repositoryRoot, "node_modules", "maplibre-gl", "dist");
const targetDirectory = join(repositoryRoot, "public", "maplibre");
const workerFiles = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(targetDirectory, { recursive: true });

for (const fileName of workerFiles) {
  copyFileSync(join(sourceDirectory, fileName), join(targetDirectory, fileName));
}

console.log("Prepared the MapLibre vector-tile worker in public/maplibre.");
