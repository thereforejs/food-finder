# food-finder

Finds foods of `@thereforejs/foods` (repo `thereforejs/foods`, local `~/projects/bls`) by what people
type, published as `@thereforejs/food-finder` (repo `thereforejs/food-finder`). foods is the database
and ships only the names; the search, aliases, language rules and compounds live here. Never push any
of it back into foods.

**`SPEC.md` is the source of truth.** Read the relevant section before touching a
rule. Where the spec is unsure it says so: never guess an answer, raise it with Flo. Decisions in it
are not reopened without him.

## Non-negotiables

- **Lazy loading must not get worse.** The finder never imports a names index itself; the app loads
  `@thereforejs/foods/names/<lang>` and passes it in. foods is a peer dependency
  `>=0.0.1 <1`: every 0.x of foods fits without a release here.
- **One entry point per language.** No module holds a collection of all languages: a map `{ de, en }`
  pulls everything into every bundle. English never lands in a German app.
- **One finder per index:** `createFinder` reads the names once; the app keeps the finder.
- **Acceptance is a bundle probe**, as in foods: the app part tiny, the index its own lazy chunk, no
  English in a German app. Worse numbers mean not done.
- **Measure, don't claim:** every number in docs (bundle size, timing) comes from a probe that ran.

## Local files

- `docs/` and `HANDOFF.md` are ignored and never committed. `docs/finder-source.tar.gz` holds the old
  search from foods; unpack it outside the project, or `vp test` collects its tests.

## Language

- Code, identifiers, comments, docs, commits, GitHub: English.
- Food names verbatim in their language (German, English).
- Chat with Flo: German.

## Code rules

- Comments: few and short, senior style. The why (a language rule, a trap), never the what or how.
- No em dashes or en dashes anywhere. Use a plain hyphen.
- Small focused files, flat structure, every rule in exactly one place. Abstraction grows with use.
- No `any`, no `as never`, no dead guards.
- Imports from `vite-plus` / `vite-plus/test`, never from `vite` or `vitest`.
- Build scripts in TypeScript under `scripts/`, run with `vpx`.

## Working with Flo

- Small slices. Name the slice in one line, show the shape before a change across several files,
  build it, report, wait.
- One question at a time, with a concrete example and a recommendation. Decide the obvious yourself;
  never agree blindly.
- If something blocks you (a download, a missing file), say so instead of working around it.

## Verification (library tier)

- **Oracle first:** a red test before each rule, from real names, then the code.
- **Sabotage probe** after each rule: break it on a copy, confirm a test fails, restore the copy and
  `cmp`. The formatter rewraps lines: check that the sabotage actually applied. Never undo work with
  `git checkout`, `git stash` or `git reset`.
- **Property tests** with `fast-check`; a seed that once failed stays in the suite.
- Before reporting: `vp check` and `vp test` green. Report failures with their output.

## Git

- Collaboration mode by default: never commit, push, open or merge PRs, or release. Flo owns git.
  Leave changes in the working tree and suggest a one-line commit message.
- Goal run only when a `/goal` is active or Flo says so: commit locally, small and meaningful; never
  push, never release.
- Until the first release, work happens directly on `main`. After it, one branch per slice off
  current `main`, created with `--no-track` (`git switch -c feat/x --no-track origin/main`); with
  tracking, `git push` targets `main` and fails.
- Commit messages: one line, Conventional Commits, Nuxt style, e.g. `feat(search): rank aliases as
  exact`. No body, no Co-Authored-By, no trailers.
- Releases run through uppt from conventional commits, set up like foods.

## Toolchain: Vite+

Vite+ (`vp`) wraps the package manager (pnpm), Vitest, Oxlint, Oxfmt and tsdown. `vp help` and
`vp <command> --help` list everything.

- `vp install` after pulling, `vp add` / `vp remove` for dependencies. Never call pnpm or npm directly.
- `vp check` (format, lint, type check), `vp test`, `vp pack` (build the library).
- Build with the local binary (`./node_modules/.bin/vp pack`): the global `vp` does not find the
  project's TypeScript 7 for the declaration files. CI uses the local one.
- `vp dlx` for one-off binaries, `vp run <script>` for package scripts that share a built-in's name.
