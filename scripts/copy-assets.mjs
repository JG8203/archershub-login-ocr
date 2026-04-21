import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const vendorDir = path.join(rootDir, "vendor");
const langDir = path.join(vendorDir, "lang-data");

const filesToCopy = [
  {
    from: path.join(rootDir, "node_modules", "tesseract.js", "dist", "tesseract.esm.min.js"),
    to: path.join(vendorDir, "tesseract.esm.min.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js", "dist", "worker.min.js"),
    to: path.join(vendorDir, "worker.min.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core.wasm.js"),
    to: path.join(vendorDir, "tesseract-core.wasm.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core.wasm"),
    to: path.join(vendorDir, "tesseract-core.wasm")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-simd.wasm.js"),
    to: path.join(vendorDir, "tesseract-core-simd.wasm.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-simd.wasm"),
    to: path.join(vendorDir, "tesseract-core-simd.wasm")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-lstm.wasm.js"),
    to: path.join(vendorDir, "tesseract-core-lstm.wasm.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-lstm.wasm"),
    to: path.join(vendorDir, "tesseract-core-lstm.wasm")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-simd-lstm.wasm.js"),
    to: path.join(vendorDir, "tesseract-core-simd-lstm.wasm.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-simd-lstm.wasm"),
    to: path.join(vendorDir, "tesseract-core-simd-lstm.wasm")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-relaxedsimd.wasm.js"),
    to: path.join(vendorDir, "tesseract-core-relaxedsimd.wasm.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-relaxedsimd.wasm"),
    to: path.join(vendorDir, "tesseract-core-relaxedsimd.wasm")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-relaxedsimd-lstm.wasm.js"),
    to: path.join(vendorDir, "tesseract-core-relaxedsimd-lstm.wasm.js")
  },
  {
    from: path.join(rootDir, "node_modules", "tesseract.js-core", "tesseract-core-relaxedsimd-lstm.wasm"),
    to: path.join(vendorDir, "tesseract-core-relaxedsimd-lstm.wasm")
  },
  {
    from: path.join(rootDir, "node_modules", "@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz"),
    to: path.join(langDir, "eng.traineddata.gz")
  }
];

await rm(vendorDir, { recursive: true, force: true });
await mkdir(langDir, { recursive: true });

for (const file of filesToCopy) {
  await ensureExists(file.from);
  await cp(file.from, file.to);
}

console.log(`Prepared OCR assets in ${vendorDir}`);

async function ensureExists(targetPath) {
  try {
    await stat(targetPath);
  } catch {
    throw new Error(`Missing expected asset: ${targetPath}`);
  }
}
