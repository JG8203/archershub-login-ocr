import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const releaseDir = path.join(distDir, "release");
const zipPath = path.join(distDir, "animlow-cortisol-release.zip");

await rm(zipPath, { force: true });
await execFileAsync("zip", ["-qr", zipPath, "."], { cwd: releaseDir });

console.log(`Packaged release archive at ${zipPath}`);
