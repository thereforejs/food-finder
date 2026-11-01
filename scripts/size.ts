// Measures the "Size" table of the README: a minimal application per entry, built with the Vite+
// bundler, minified, every chunk gzipped. Run `vp pack` first; it measures dist/, as users get it.
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite-plus";

const root = resolve(import.meta.dirname, "..");
const dist = (file: string) => JSON.stringify(join(root, "dist", file));
const names = (language: string) =>
  JSON.stringify(join(root, "node_modules/@thereforejs/foods/dist/names", `${language}.mjs`));

// The names load on first use, as the README shows, so they land in a chunk of their own.
const apps = {
  "/de": `import { createFinder } from ${dist("de.mjs")};
export const search = async (q) => createFinder((await import(${names("de")})).names).search(q);`,
  "/de and /de/meanings": `import { createFinder } from ${dist("de.mjs")};
import { meanings } from ${dist("de/meanings.mjs")};
export const search = async (q) => createFinder((await import(${names("de")})).names, { meanings: [meanings] }).search(q);`,
  "/en": `import { createFinder } from ${dist("en.mjs")};
export const search = async (q) => createFinder((await import(${names("en")})).names).search(q);`,
};

const gzip = (path: string) => gzipSync(readFileSync(path)).length;

for (const [label, source] of Object.entries(apps)) {
  const dir = mkdtempSync(join(tmpdir(), "food-finder-size-"));
  try {
    writeFileSync(join(dir, "main.js"), source);
    await build({
      root: dir,
      logLevel: "silent",
      build: {
        minify: true,
        outDir: join(dir, "out"),
        lib: { entry: join(dir, "main.js"), formats: ["es"] },
      },
    });
    const files = readdirSync(join(dir, "out"), { recursive: true })
      .map(String)
      .filter((file) => /\.m?js$/.test(file));
    const sizes = files.map((file) => ({ file, bytes: gzip(join(dir, "out", file)) }));
    const app = sizes.find(({ file }) => file.split("/").pop()?.startsWith("main"));
    const rest = sizes.filter((size) => size !== app);
    console.log(
      `${label}: app ${app?.bytes} B, names ${rest.map(({ bytes }) => `${bytes} B`).join(", ")}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
