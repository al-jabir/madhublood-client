import { mkdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const root = new URL("../public/ocr/", import.meta.url);
await mkdir(root, { recursive: true });
const packages = {
  worker: dirname(require.resolve("tesseract.js/package.json")),
  core: dirname(require.resolve("tesseract.js-core/package.json")),
};
const files = [
  [join(packages.worker, "LICENSE.md"), "LICENSE-tesseract.js.md"],
  [join(packages.worker, "dist/worker.min.js"), "worker.min.js"],
  [
    join(packages.core, "tesseract-core-lstm.wasm.js"),
    "tesseract-core-lstm.wasm.js",
  ],
  [join(packages.core, "tesseract-core-lstm.wasm"), "tesseract-core-lstm.wasm"],
  [join(packages.core, "LICENSE"), "LICENSE-core"],
];
for (const lang of ["ben", "eng"])
  files.push([
    join(
      dirname(require.resolve(`@tesseract.js-data/${lang}/package.json`)),
      "4.0.0_best_int",
      `${lang}.traineddata.gz`,
    ),
    `${lang}.traineddata.gz`,
  ]);
for (const [source, target] of files)
  await copyFile(source, new URL(target, root));
console.log("Local Bengali/English OCR assets ready.");
