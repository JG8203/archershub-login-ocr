import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const filesToCheck = [
  "content.js",
  "offscreen.js",
  "service-worker.js"
];

for (const file of filesToCheck) {
  await execFileAsync(process.execPath, ["--check", path.join(rootDir, file)]);
}

const manifests = ["manifest.json", "dist/release/manifest.json", "dist/dev/manifest.json"];
for (const relativePath of manifests) {
  JSON.parse(await readFile(path.join(rootDir, relativePath), "utf8"));
}

console.log("Syntax and manifest checks passed.");
