# Known Issues (found during the DATA_SEPARATION work)

Pre-existing problems surfaced while executing [`DATA_SEPARATION.md`](./DATA_SEPARATION.md)
and running the verification checklist (Step 6). None of these were introduced by that work —
each was confirmed present at `HEAD` before the data-separation changes.

## 1. `MobCodePlugin` disables the `opencode` provider, but tests still expect it

**Status:** broken at `HEAD` — pre-existing.

**Root cause:** `packages/core/src/plugin/provider/mobcode.ts` registers `MobCodePlugin`, which
removes every provider listed in `DISABLED_DEFAULT_PROVIDERS` from the catalog at plugin-init
time. `DISABLED_DEFAULT_PROVIDERS` (`packages/core/src/billing/mobcode.ts:27`) is
`["opencode", "opencode-go"]`. So in any environment where the plugin runs, `Provider.list()`
never contains the built-in `opencode` (or `opencode-go`) provider.

**Impact — failing tests (confirmed identical at `HEAD` via `git stash`):**

- `packages/opencode/test/provider/provider.test.ts`
  - `opencode loader keeps paid models when config apiKey is present`
  - `opencode loader keeps paid models when auth exists`
  - Both call `paid(...)` which asserts `providers[ProviderV2.ID.opencode]` is defined →
    `Received: undefined`.
- `packages/opencode/test/session/prompt.test.ts`
  - `prompt tools replace previous prompt tool rules` → `ProviderNoProvidersError: No providers
    are available`, because the fixture's provider catalog is empty after the plugin removes the
    `opencode` provider the fixture relies on.

**Why this is a real bug, not just a test problem:** the feature contract those tests encode is
"the `opencode` provider keeps its paid models once the user supplies a config `apiKey` or
auth". The `MobCodePlugin` currently removes the provider unconditionally, so even a user who
configures a real `opencode` API key gets no `opencode` provider at all. The disable intent was
almost certainly "don't offer the hosted provider by default", not "remove it even when the user
explicitly configures/auths it".

**Likely fix (pick one):**
1. Make `MobCodePlugin` only strip the providers when the user has **not** configured auth/API
   key for them (i.e. keep them when `apiKey`/auth exists), restoring the tested contract.
2. Or scope the plugin out of the test runtime (don't load `MobCodePlugin` in `test/preload.ts`
   / test layers), and update the two tests to assert the provider is absent by default.
3. Or update the two tests to match the new intended behavior (provider absent even with
   credentials) — only if that is genuinely the product decision.

## 2. `bun run lint` exits 1 — deprecated octal escape in the prompt input

**Status:** broken at `HEAD` — pre-existing.

**File:** `packages/session-ui/src/v2/components/prompt-input/index.tsx:163`

**Error:** `'0'-prefixed octal literals and octal escape sequences are deprecated`
(severity `error`), pointing at the Tailwind arbitrary value
`empty:before:content-['\200B']`. oxlint reads `\200` as a deprecated octal escape followed by
`B`; the intent is the zero-width space `U+200B`.

**Result:** `bun run lint` reports `Found 4835 warnings and 1 error` and exits non-zero.

**Likely fix:** write the zero-width space as `content-['\u200B']` (or use the literal
character) inside the arbitrary value.

## 3. `packages/core/package.json` declares a `mobcode` bin that does not exist

**Status:** broken at `HEAD` — pre-existing.

**File:** `packages/core/package.json`

```json
"bin": { "mobcode": "./bin/mobcode.cjs" }
```

But `packages/core/bin/mobcode.cjs` does not exist in the repo (only
`packages/opencode/bin/mobcode.cjs` is tracked; upstream had `packages/core/bin/opencode`).
This was introduced by the earlier CLI-rename commits (`2b5f922c87`). The CLI is served by the
`packages/opencode` bin (`mobcode` → `./bin/mobcode.cjs`), which works; the `core` bin entry is
dead weight that will break any `npm`/`bun link` that resolves the `core` package's bin.

**Likely fix:** either remove the `bin` block from `packages/core/package.json` (core is a
library), or restore a real `packages/core/bin/mobcode.cjs` (copy of the opencode launcher).

---

## Verification notes (Step 6 of DATA_SEPARATION)

- `bun run typecheck` — passes for all 28 workspace packages.
- Config/TUI tests — pass:
  - `packages/core`: `test/config/config.test.ts` (15/15)
  - `packages/opencode`: `test/config/config.test.ts` + `test/config/tui.test.ts` (132/132)
- The only `opencode` strings intentionally left in source are: the `opencode` provider ID,
  `OPENCODE_*` env vars, `*.opencode.ai` URLs, the `@opencode-ai/*` scope, package names, and
  legacy-cleanup paths (`uninstall.ts`, `installation/index.ts`, WSL `~/.opencode/bin`).
- Windows-only environment flakes (not caused by this work): symlink `EPERM` in
  `packages/opencode/test/util/filesystem.test.ts`, and ripgrep download/extract timeouts on a
  fresh test cache.
