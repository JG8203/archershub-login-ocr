import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const releaseDir = path.join(distDir, "release");
const devDir = path.join(distDir, "dev");

const extensionFiles = [
  "assets",
  "content.css",
  "content.js",
  "offscreen.html",
  "offscreen.js",
  "service-worker.js",
  "vendor"
];

await rm(distDir, { recursive: true, force: true });
await mkdir(releaseDir, { recursive: true });
await mkdir(devDir, { recursive: true });

const releaseManifest = JSON.parse(await readFile(path.join(rootDir, "manifest.json"), "utf8"));
const devManifest = createDevManifest(releaseManifest);

await copyExtensionFiles(releaseDir);
await copyExtensionFiles(devDir);
await writeFile(path.join(releaseDir, "manifest.json"), JSON.stringify(releaseManifest, null, 2) + "\n");
await writeFile(path.join(devDir, "manifest.json"), JSON.stringify(devManifest, null, 2) + "\n");

console.log(`Built release bundle in ${releaseDir}`);
console.log(`Built dev bundle in ${devDir}`);

async function copyExtensionFiles(targetDir) {
  for (const relativePath of extensionFiles) {
    await cp(path.join(rootDir, relativePath), path.join(targetDir, relativePath), {
      recursive: true
    });
  }
}

function createDevManifest(releaseManifest) {
  const devHosts = [
    "https://archershub.dlsu.edu.ph/*"
  ];

  return {
    ...releaseManifest,
    host_permissions: devHosts,
    content_scripts: releaseManifest.content_scripts.map((contentScript) => ({
      ...contentScript,
      matches: devHosts
    })),
    web_accessible_resources: releaseManifest.web_accessible_resources.map((entry) => ({
      ...entry,
      matches: devHosts
    }))
  };
}
