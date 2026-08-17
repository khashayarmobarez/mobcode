# Data Separation Plan — MobCode ↔ OpenCode

Goal: make **MobCode** (this fork) fully independent from a real **opencode** install on the same machine — its own global config, its own data/cache/auth directories, and its own project-config directory.

## Current state (before this plan is executed)

| Item | Current | Target |
| --- | --- | --- |
| CLI command | `mobcode` ✅ (done) | — |
| Billing plans + credits stub | ✅ (done) | — |
| Global data dir | `~/.local/share/opencode` (shared!) | `~/.local/share/mobcode` |
| Global config dir | `~/.config/opencode` (shared!) | `~/.config/mobcode` |
| Config filename | `opencode.json` / `opencode.jsonc` (shared!) | `mobcode.json` / `mobcode.jsonc` |
| Project config dir | `.opencode/` (shared!) | `.mobcode/` |
| `mobcode` command | ✅ works via `bun link` | — |

Because the dirs are shared, `mobcode` currently reads the same config, models, and auth as a real opencode install.

---

## Step 1 — Global data directory (`~/.mobcode*`)

File: `packages/core/src/global.ts`

```ts
const app = "mobcode"   // currently "opencode"
```

One-line change. This switches `data`, `cache`, `config`, `state`, `tmp`, `log`, `bin`, `repos` from `~/*/opencode` to `~/*/mobcode` (via xdg-basedir: `~/.local/share/mobcode`, `~/.cache/mobcode`, `~/.config/mobcode`, `~/.local/state/mobcode`).

- **Risk:** LOW — no tests assert the literal `opencode` dir name for global paths; config tests use explicit temp dirs.
- **Verify:** run `mobcode` once, then check that `~/.config/mobcode/` and `~/.cache/mobcode/` appear and `~/.config/opencode/` is NOT created by mobcode.

## Step 2 — Config filename (`mobcode.json`)

Change every config-resolution filename from `opencode.json(c)` to `mobcode.json(c)`:

| File | What to change |
| --- | --- |
| `packages/core/src/config.ts` | `const names = ["mobcode.json", "mobcode.jsonc"]` |
| `packages/opencode/src/config/config.ts` | `globalConfigFile()` candidates (`mobcode.jsonc`, `mobcode.json`, `config.json`) |
| `packages/opencode/src/config/config.ts` | the two `for (const file of ["opencode.json", "opencode.jsonc"])` loops (project dirs + managed dir) |
| `packages/opencode/src/config/tui-migrate.ts` | `ConfigPaths.fileInDirectory(Global.Path.config, "mobcode")` + `Filesystem.findUp(["mobcode.json", "mobcode.jsonc"], ...)` + `fileInDirectory(dir, "mobcode")` |
| `packages/opencode/src/cli/cmd/mcp.ts` | `resolveConfigPath()` candidates + `.mobcode/` subdir candidates |

Also update user-facing strings mentioning the filename:

| File | String |
| --- | --- |
| `packages/opencode/src/cli/error.ts` (~line 68) | "check your config (opencode.json)" → `mobcode.json` |
| `packages/opencode/src/cli/cmd/providers.ts` (~450, 459) | "configure it in opencode.json" → `mobcode.json` |
| `packages/opencode/src/cli/cmd/mcp.ts` (~190) | "Remote MCP ... opencode.json" → `mobcode.json` |

- **Risk:** MEDIUM — test fixture helpers also write `opencode.json`; they must change too (Step 4).
- **Verify:** `bun test packages/core/test/config/config.test.ts` after Step 4.

## Step 3 — Project config directory (`.mobcode/`)

Change the project-level config dir convention from `.opencode/` to `.mobcode/`:

| File | Change |
| --- | --- |
| `packages/core/src/config.ts` (~181, 189, 195) | discovery `targets: [".mobcode", ...names]`, `path.basename(item) === ".mobcode"` (×2) |
| `packages/opencode/src/config/paths.ts` (~29, 35) | `afs.up({ targets: [".mobcode"] })` (×2) |
| `packages/opencode/src/config/config.ts` (~425) | `dir.endsWith(".mobcode")` |
| `packages/opencode/src/cli/cmd/mcp.ts` (~399) | `.mobcode` subdirectory |
| `packages/core/src/plugin/agent.ts` (~142) | `.mobcode/plans/*.md` permission rule |
| `packages/opencode/src/agent/agent.ts` (~173) | `.mobcode/plans/*.md` permission |
| `packages/opencode/src/cli/cmd/agent.ts` (~111) | `.mobcode/agents` path |
| `packages/opencode/src/plugin/install.ts` (~337) | plugin root `.mobcode` |
| `packages/opencode/src/plugin/tui/runtime.ts` (~256, 258, 817) | `.mobcode/themes`, `.mobcode/tui.json` |
| `packages/opencode/src/session/session.ts` (~333) | `.mobcode/plans` path |
| `packages/opencode/src/skill/index.ts` (~34) | skill description doc string (`.mobcode/`, `~/.config/mobcode/`, `mobcode.json`) |
| `packages/core/src/plugin/skill.ts` (~23) | same doc-string update |

Also rename this repo's own config dir:

```sh
git mv .opencode .mobcode
git mv .mobcode/opencode.jsonc .mobcode/mobcode.jsonc
```

And inside the repo's own files:

| File | Change |
| --- | --- |
| `.mobcode/command/translate.md` | `.mobcode/glossary/<locale>.md` |
| `.mobcode/skills/effect/SKILL.md` | `.mobcode/references/effect-smol` (×3) |
| `.gitignore` | `/opencode.json` → `/mobcode.json` |

- **Risk:** HIGH — this is where most test churn comes from (see Step 4).

## Step 4 — Test fixtures

Bulk-update test fixtures (all tracked `*.test.ts` / `*.test.tsx` under `packages/`):

1. `opencode.jsonc` → `mobcode.jsonc`, then `opencode.json` → `mobcode.json` (config filename).
2. `".opencode"` (quoted, exact) → `".mobcode"` (project dir path args).
3. `.opencode/` → `.mobcode/` in path/prose strings.

Plus the **non-test fixture helpers** that the earlier attempt missed (these caused most of the failures):

| File | Change |
| --- | --- |
| `packages/opencode/test/fixture.ts` (~97, 156) | writes `opencode.json` → `mobcode.json` |
| `packages/opencode/test/httpapi-exercise/index.ts` (~88, 101) | `opencode.jsonc` → `mobcode.jsonc` |
| `packages/opencode/test/cli/cli-process.ts` (~11) | comment only |

**DO NOT touch:**

- `ProviderV2.ID.opencode` / `providerID === "opencode"` — provider ID, not the dir
- `OPENCODE_*` env vars and `Flag.OPENCODE_*` (env var system — separate rename)
- `~/.opencode/bin` legacy checks in `packages/opencode/src/cli/cmd/uninstall.ts` + `packages/opencode/src/installation/index.ts:175` (cleaning up OLD opencode installs)
- URLs: `*.opencode.ai`, `console.opencode.ai`, `models.opencode.ai`, `formulae.brew.sh/.../opencode.json` (Homebrew), Scoop bucket URLs
- `ai.opencode.managed` (macOS MDM plist domain)
- `sst-dev.opencode` (VS Code extension ID)
- `engines.opencode` (npm package engines field)
- `@opencode-ai/*` scope (~1,300 refs — separate scripted task, do NOT touch)
- `OpencodeClient` / `OpencodeKeymapProvider` identifiers (lowercase `c`)

## Step 5 — `.opencode-version` file

`packages/core/src/skill/discovery.ts` (~129, 180) and `packages/opencode/src/skill/discovery.ts` (~80, 105): rename `.opencode-version` → `.mobcode-version` (the project-config version marker).

## Step 6 — Verification checklist

```sh
# typecheck
bun run typecheck --cwd packages/core
bun run typecheck --cwd packages/opencode

# config tests (the ones that broke last time)
bun test test/config/config.test.ts --cwd packages/core
bun test test/config/config.test.ts test/config/tui.test.ts --cwd packages/opencode

# smoke: mobcode works and does NOT touch ~/.config/opencode
mobcode --help
ls ~/.config/mobcode   # exists
ls ~/.config/opencode  # must NOT be created by mobcode

# isolation check: mobcode models list must not read real opencode auth/config
mobcode models
```

## Step 7 — Docs to update afterwards

- `AGENTS.md` — conventions section (config filename, dirs)
- `DEVELOPMENT.md` — Persian/RTL section
- `SECURITY.md` — server-mode note
- `mobarrez-code-build-plan.md` — Phase 1 decision item
- `packages/opencode/README.md`
- `packages/core/src/plugin/skill/customize-opencode.md` (config-location table)

## Known pitfalls from the first attempt

- The full filesystem walk (`Get-ChildItem packages -Recurse`) times out — use `git ls-files '*.test.ts'` to list files.
- Config-filename changes break tests until BOTH the test files AND the helper files (`fixture.ts`, `httpapi-exercise/index.ts`) are updated.
- Do the replaces in this order: `opencode.jsonc` → `mobcode.jsonc` FIRST, then `opencode.json` → `mobcode.json` (otherwise `.jsonc` gets half-replaced).
- `uninstall.ts` / `installation/index.ts` keep `".opencode"` / `".opencode/bin"` — they clean up legacy opencode installs. Exclude them from every replace.
- After all steps, the only remaining `opencode` strings should be: provider ID, env vars, URLs, scope, package names — all intentionally kept.
