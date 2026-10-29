import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    // One entry per language and no root: no module holds all languages (SPEC 2).
    entry: {
      de: "src/de/index.ts",
      "de/meanings": "src/de/meanings.ts",
      en: "src/en/index.ts",
      "en/meanings": "src/en/meanings.ts",
    },
    dts: {
      generator: "tsgo",
    },
    exports: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
