# Known Issues (found during the DATA_SEPARATION work)

Pre-existing problems surfaced while executing [`DATA_SEPARATION.md`](./DATA_SEPARATION.md)
and running the verification checklist (Step 6). None of these were introduced by that work —
each was confirmed present at `HEAD` before the data-separation changes.

---

## 1. The `opencode` provider was stubbed out, but tests still expect it

**Status:** broken at `HEAD` — pre-existing. **Fix decision (confirmed): keep the provider
dead in MobCode, fix the tests.**

**Root cause:** commit `7ba4754197` ("setting up the plans and models and removing opencode
models") replaced the upstream `opencode` custom loader in
`packages/opencode/src/provider/provider.ts` (~line 176) with a stub:

```ts
opencode: Effect.fnUntraced(function* (_input: Info) {
  return {
    autoload: false,
    options: {},
  }
}),
```

Upstream, the loader kept the free models and set `autoload: true` even without credentials,
and gated paid models behind env/auth/config `apiKey`. The stub makes the `opencode` provider
never appear in `Provider.list()` at all. A secondary, consistent layer is `MobCodePlugin`
(`packages/core/src/plugin/provider/mobcode.ts`), which removes `opencode`/`opencode-go` from
the core Catalog via `DISABLED_DEFAULT_PROVIDERS`
(`packages/core/src/billing/mobcode.ts:27`).

**Impact — failing tests (confirmed identical at `HEAD` via `git stash`):**

- `packages/opencode/test/provider/provider.test.ts`
  - `opencode loader keeps paid models when config apiKey is present`
  - `opencode loader keeps paid models when auth exists`
  - Both call `paid(...)` which asserts `providers[ProviderV2.ID.opencode]` is defined →
    `Received: undefined`.
- `packages/opencode/test/session/prompt.test.ts`
  - `prompt tools replace previous prompt tool rules` → `ProviderNoProvidersError: No providers
    are available`. In the test env no API keys are set and no provider auto-loads
    (`opencode` was the only always-on fallback provider upstream), so `Provider.defaultModel`
    finds an empty provider map.

**Decided fix (per product decision — "This provider is not available in MobCode"):**

1. `packages/opencode/test/provider/provider.test.ts` — remove the `paid()` helper (~79–83) and
   replace the two failing tests (~2041–2092) with assertions that
   `providers[ProviderV2.ID.make("opencode")]` stays `undefined` both with no config and with
   `provider.opencode.options.apiKey` configured / `auth.json` written. Keep the existing
   `tmpdirScoped` / `listIn` / `provideMultiInstance` harness.
2. `packages/opencode/test/session/prompt.test.ts` — in
   `prompt tools replace previous prompt tool rules` (~991–1016), register the existing `test`
   provider fixture at the top of the body:
   ```ts
   const { directory: dir } = yield* TestInstance
   yield* writeConfig(dir, cfg)
   ```
   `noReply: true` means no LLM call happens, so no test server is needed; `defaultModel`
   then resolves `test/test-model` instead of throwing `NoProvidersError`.
3. Production code stays unchanged (stub loader + `MobCodePlugin` both remain, encoding the
   product decision).

**Rejected alternative:** restoring the upstream BYOK loader (autoload when the user
configures an `opencode` apiKey/auth) — more churn and contradicts the
"This provider is not available in MobCode" copy in `packages/opencode/src/cli/cmd/providers.ts`.

---

## 2. `bun run lint` exits 1 — deprecated octal escape in the prompt input

**Status:** broken at `HEAD` — pre-existing (inherited verbatim from upstream).

**File:** `packages/session-ui/src/v2/components/prompt-input/index.tsx:163`

**Error:** `'0'-prefixed octal literals and octal escape sequences are deprecated`
(severity `error`), pointing at the Tailwind arbitrary value
`empty:before:content-['\200B']`. oxlint reads `\200` as a deprecated octal escape followed by
`B`; the intent is the zero-width space `U+200B`.

**Result:** `bun run lint` reports `Found 4835 warnings and 1 error` and exits non-zero.

**Also a runtime bug:** the JS string decodes `\200` (octal = U+0080), so the runtime class
attribute contains `content-['\x80B']`, which never matches Tailwind's generated
`content-\[\'\\200B\'\]` selector — the `empty:before` zero-width-space placeholder rule for
the empty composer is silently dead.

**Decided fix:** double the backslash in the TSX string:

```ts
empty:before:content-['\\200B']
```

- Runtime class now contains the literal `\200B` → matches the generated selector.
- Tailwind's arbitrary-value decoder turns `\\200B` into CSS `content: '\200B'` (ZWSP) as
  before.
- oxlint no longer sees an octal escape.

**Verify:** `bunx oxlint` reports 0 errors; rebuild the app/session-ui CSS and grep for the
`content-\[\'\\200B\'\]` selector; visual check of the empty composer.

---

## 3. `packages/core/package.json` declares a `mobcode` bin that does not exist

**Status:** broken at `HEAD` — pre-existing.

**File:** `packages/core/package.json`

```json
"bin": { "mobcode": "./bin/mobcode.cjs" }
```

`packages/core/bin/mobcode.cjs` does not exist in the repo (only
`packages/opencode/bin/mobcode.cjs` is tracked). The declaration was introduced by the earlier
CLI-rename commits (`2b5f922c87`); upstream's `"opencode": "./bin/opencode"` was already
dangling upstream (the file is absent from `upstream/dev` too). The CLI is served by the
`packages/opencode` bin, which works; the `core` bin entry is dead weight that will break any
`npm`/`bun link` that resolves the `core` package's bin.

**Decided fix:** remove the `bin` block from `packages/core/package.json` (core is a library;
the real CLI entrypoint stays in `packages/opencode`).

**Verify:** `git grep -n "bin/mobcode" packages/` shows no other references; `bun install`
stays clean; `mobcode` still resolves from the `packages/opencode` workspace.

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
  `packages/opencode/test/util/filesystem.test.ts`, ripgrep download/extract timeouts on a
  fresh test cache, and the borderline 5s timing on
  "glob tool keeps instance context during prompt runs".

**After these fixes land, run:** `bun run lint` (0 errors), `bun run typecheck`, and from
`packages/opencode`: `bun test test/provider/provider.test.ts test/session/prompt.test.ts`.