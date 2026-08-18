# Mobarrez Code — Developer Guide

This is the developer guide for **Mobarrez Code**: a Persian-localized fork of [`sst/opencode`](https://github.com/sst/opencode) (MIT) with Toman billing and a local model gateway.

If you just want to _use_ the product, read the [README](./README.md) instead. This file is for people who want to **understand**, **develop**, or **test** the codebase.

> [!TIP]
> **TL;DR — there are three runnable surfaces, all powered by one core:**
>
> 1. **Terminal app (CLI/TUI)** — `packages/opencode` — runs in your terminal.
> 2. **Desktop app** — `packages/desktop` + `packages/app` — an Electron window around a SolidJS web UI.
> 3. **Headless server** — `packages/opencode` (the `opencode serve` command) — exposes the API over HTTP/SSE on `:4096`; both the TUI and the desktop app talk to it.

---

## 1. The big picture

```
                    ┌─────────────────────────────────────────┐
                    │           packages/llm                  │
                    │  (provider-neutral LLM core: request,   │
                    │   events, tools, provider adapters)     │
                    └───────────────────▲─────────────────────┘
                                        │ uses
                                        │
   ┌────────────────────────────────────┴────────────────────────────────────┐
   │                          packages/opencode                              │
   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
   │  │   TUI/CLI   │  │   Server    │  │   Session   │  │  Tools/MCP  │   │
   │  │ (SolidJS + │  │ (HTTP/SSE   │  │  lifecycle  │  │ file/bash/  │   │
   │  │  opentui)  │  │  on :4096)  │  │ + LLM loop  │  │ web/...     │   │
   │  └─────┬──────┘  └──────▲──────┘  └─────────────┘  └──────────────┘   │
   │        │                │                                              │
   └────────┼────────────────┼──────────────────────────────────────────────┘
            │ runs            │ HTTP/SSE
            │                 │
   ┌────────▼─────┐   ┌───────┴───────────────────────────────────────────┐
   │  terminal     │   │  packages/app  (SolidJS web UI)                    │
   │  (the user)   │   │   ▲                                                │
   └───────────────┘   │   │ bundled into                                   │
                       │   │                                                │
                       │   ▼                                                │
                       │  packages/desktop (Electron shell + builder)      │
                       │   ▲                                                │
                       └───┘ the user double-clicks the app                 │
```

- **The brain** lives in `packages/opencode` and `packages/core`. It runs sessions, calls the LLM, executes tools, and serves an HTTP/SSE API.
- **The LLM layer** (`packages/llm`) is a schema-first, provider-neutral core. `packages/opencode` asks it for a stream of events; the provider quirks live in adapters.
- **The terminal UI** is built with SolidJS + [opentui](https://github.com/sst/opentui) inside `packages/opencode/src/cli/cmd/tui.ts` and `packages/tui`.
- **The desktop app** is an Electron window (`packages/desktop`) that loads the **web UI** (`packages/app`, SolidJS). The web UI talks to the same HTTP/SSE server that the TUI does.
- **Shared UI** components (buttons, markdown renderer, session pane, icons) live in `packages/ui` and are used by both `app` and `tui`.

That's the whole shape. Everything else either supports these pieces or is internal plumbing.

---

## 2. Where each product lives

| Product / Surface                 | Folder                                                                                         | What it is                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Terminal app (CLI + TUI)**      | [`packages/opencode`](packages/opencode)                                                       | The `opencode` binary. Runs the agent loop, the headless server, and the terminal UI.                               |
| **TUI primitives**                | [`packages/tui`](packages/tui)                                                                 | Reusable terminal-UI components, contexts, themes, and feature plugins (SolidJS + opentui).                         |
| **Web UI (rendered in Electron)** | [`packages/app`](packages/app)                                                                 | The SolidJS web app shown inside the desktop window. Also served by `opencode web`.                                 |
| **Desktop app shell**             | [`packages/desktop`](packages/desktop)                                                         | Electron main/preload, window management, auto-updater, native menus, and `electron-builder` config.                |
| **Headless API server**           | `packages/opencode` (`opencode serve`)                                                         | HTTP/SSE API on port 4096. Used by both the TUI and the web app.                                                    |
| **LLM core (provider-neutral)**   | [`packages/llm`](packages/llm)                                                                 | Schema-first request/event/tool language with provider adapters (OpenAI, Anthropic, Gemini, Bedrock, etc.).         |
| **Core shared services**          | [`packages/core`](packages/core)                                                               | Database/storage, pty, filesystem, Effect layers, and the session runner used across packages.                      |
| **HTTP API server logic**         | [`packages/server`](packages/server)                                                           | The server-side Effect `HttpApi` definitions.                                                                       |
| **HTTP API protocol/schema**      | [`packages/protocol`](packages/protocol), [`packages/schema`](packages/schema)                 | Authoritative endpoint/schemas shared by server and SDK.                                                            |
| **Generated SDK + client**        | [`packages/client`](packages/client), `packages/sdk`, [`packages/sdk-next`](packages/sdk-next) | Typed clients consumed by the web app and external tools.                                                           |
| **Shared web UI components**      | [`packages/ui`](packages/ui)                                                                   | Buttons, markdown, icons, themes — used by `app` and `tui`.                                                         |
| **Session UI (shared)**           | [`packages/session-ui`](packages/session-ui)                                                   | The session/timeline surface reused by both app and TUI.                                                            |
| **Plugin SDK**                    | [`packages/plugin`](packages/plugin)                                                           | Source for `@opencode-ai/plugin` — the toolkit for authoring TUI and agent plugins.                                 |
| **Confined code execution**       | [`packages/codemode`](packages/codemode)                                                       | Effect-native sandbox where a model writes small JS programs that can only call host-supplied tools.                |
| **HTTP recorder (cassettes)**     | [`packages/http-recorder`](packages/http-recorder)                                             | Records/replays provider HTTP used by `packages/llm` tests.                                                         |
| **HTTP API codegen**              | [`packages/httpapi-codegen`](packages/httpapi-codegen)                                         | Build-time codegen from the Effect `HttpApi` to client + OpenAPI.                                                   |
| **Brand & logo assets**           | [`packages/identity`](packages/identity)                                                       | Logo marks (light/dark/SVG/PNG) for Mobarrez Code.                                                                  |
| **Desktop icons**                 | [`packages/desktop/icons`](packages/desktop/icons)                                             | `dev` / `beta` / `prod` icon sets. Re-sync when `identity` changes.                                                 |
| **Docs content (Mintlify)**       | [`packages/docs`](packages/docs)                                                               | The public docs site content.                                                                                       |
| **Billing reference (read-only)** | [`packages/console`](packages/console)                                                         | Upstream opencode's hosted billing backend (SST/Cloudflare). Reference architecture only — not dragged along as-is. |

---

## 3. Getting started (5 minutes)

### Requirements

- **Bun 1.3+** (the only supported runtime — not Node).
- On Windows, you'll also want **Visual Studio Build Tools** with the _Desktop development with C++_ workload, because some native deps (`tree-sitter-powershell`, `node-pty`, `@parcel/watcher`) need to compile.

### Install & run

```bash
bun install        # install all workspaces
bun dev            # run the terminal app inside packages/opencode
bun dev .          # run the terminal app against the current repo
bun dev serve      # start the headless API server on :4096
bun dev web        # start server + open the web UI
```

### Run the desktop app (the primary surface for Mobarrez Code)

```bash
bun run --cwd packages/desktop dev        # Electron + Vite dev
bun run --cwd packages/desktop build      # production build of JS assets
bun run --cwd packages/desktop package   # bundle into an installer in packages/desktop/dist/
```

### Run the web UI standalone (for fast UI iteration)

Open two terminals:

```bash
# terminal 1 — backend
bun run --cwd packages/opencode --conditions=browser ./src/index.ts serve --port 4096

# terminal 2 — web UI
bun run --cwd packages/app dev -- --port 4444
# open http://localhost:4444  (proxies backend on :4096)
```

> [!IMPORTANT]
> `opencode dev web` proxies `https://app.opencode.ai`, so _local UI/CSS changes will not show there_. For local UI work, run the backend and app dev servers separately as shown above.

---

## 4. Building, testing, type-checking, linting

Root-level commands (see `package.json`):

```bash
bun run typecheck    # tsgo across the monorepo via turbo
bun run lint         # oxlint
```

> [!WARNING]
> **Never run tests from the repo root.** The root `bun test` script is intentionally disabled (`echo 'do not run tests from root' && exit 1`). Each package owns its own test setup.

### Per-package test commands

| Package                  | Command (run from the package dir)         |
| ------------------------ | ------------------------------------------ |
| `packages/opencode`      | `bun test --timeout 30000 --only-failures` |
| `packages/core`          | `bun test --only-failures`                 |
| `packages/llm`           | `bun test --timeout 30000 --only-failures` |
| `packages/ui`            | `bun test src --only-failures`             |
| `packages/app` (unit)    | `bun run test:unit`                        |
| `packages/app` (browser) | `bun run test:browser`                     |
| `packages/app` (E2E)     | `bun run test:e2e:local`                   |

The Playwright E2E suite in `packages/app` expects a backend at `localhost:4096` and a Vite dev server at `localhost:3000` by default. Install browsers once with `bunx playwright install chromium`.

### HTTP API exercise (coverage + auth + effect)

```bash
cd packages/opencode
bun run script/httpapi-exercise.ts --mode coverage --fail-on-missing --fail-on-skip
bun run script/httpapi-exercise.ts --mode auth      --fail-on-missing --fail-on-skip
bun run script/httpapi-exercise.ts --mode effect    --fail-on-missing --fail-on-skip
```

### LLM provider tests (recorded cassettes)

Recorded tests replay cassettes by default. To re-record against a live provider:

```bash
RECORD=true bun test          # inside packages/llm
```

Filter with `RECORDED_PROVIDER=openai`, `RECORDED_PREFIX=openai-chat`, `RECORDED_TAGS=tool`, or `RECORDED_TEST="streams text"`. Don't blanket re-record — provider streams contain volatile IDs. Prefer deleting one cassette and re-recording just that scenario. See `packages/llm/AGENTS.md` for the full strategy.

### Standalone binary build (—"localcode")

```bash
./packages/opencode/script/build.ts --single
# output: packages/opencode/dist/opencode-<platform>/bin/opencode
```

### Regenerating the SDK after API changes

If you change `packages/opencode/src/server/server.ts` or any contract surface:

```bash
./script/generate.ts
```

The generated SDK and client must stay in sync; the build flags committed-output drift.

---

## 5. Debugging

Bun debugging works best with `--inspect=ws://...` and an attach-mode debugger (not `request: "launch"`).

### Two-process debugging (server + TUI)

```bash
# server
bun run --inspect=ws://localhost:6499/ --cwd packages/opencode ./src/index.ts serve --port 4096

# attach the TUI to the running server
opencode attach http://localhost:4096
```

Or, debug the TUI itself:

```bash
bun run --inspect=ws://localhost:6499/ --cwd packages/opencode --conditions=browser ./src/index.ts
```

`--inspect-wait` / `--inspect-brk` pause until a debugger attaches. To avoid typing the URL every time, `export BUN_OPTIONS=--inspect=ws://localhost:6499/`.

VSCode example configs live in `.vscode/settings.example.json` and `.vscode/launch.example.json`.

> [!TIP]
> If you want breakpoints in server code while running the TUI, use `bun dev spawn` instead of `bun dev` — `bun dev` runs the server in a worker thread where breakpoints may not fire.

---

## 6. Conventions you should follow

These are abbreviated from [`AGENTS.md`](./AGENTS.md) and the per-package `AGENTS.md` files. Read those for the full rules.

**Code**

- **No comments** unless truly necessary — code should be self-documenting.
- Prefer `Effect.gen(function* () {...})` for composition; use `Effect.fn("Domain.method")` for named/traced effects.
- Use `Effect.void` over `Effect.succeed(undefined)`.
- Prefer Effect services (`FileSystem`, `HttpClient`, `Path`, `Clock`, `DateTime`) over raw Node APIs in Effect code.
- Don't use `export namespace Foo { ... }` — use flat top-level exports + `export * as Foo from "./foo"` self-reexport.
- In multi-sibling directories (`src/session/`, `src/config/`), keep one file per sibling and **no barrel `index.ts`** — barrels defeat tree-shaking and slow load.
- `InstanceState` (per-directory) vs shared `Runtime`: if two open directories should not share one copy of a service, it needs `InstanceState`.

**Persian / RTL** (Mobarrez Code specific)

- All user-facing text should be in **Persian**, with `dir="rtl"` layout.
- Persian strings use the `rtl` layout.
- The **config filename is `mobcode.json`** (`mobcode.jsonc`), the project config dir is `.mobcode/`, and global config/data/cache live under `~/.config/mobcode`, `~/.local/share/mobcode`, `~/.cache/mobcode` — fully separated from a real opencode install per [`DATA_SEPARATION.md`](./DATA_SEPARATION.md). The only intentional `opencode` strings left in source are the provider ID, `OPENCODE_*` env vars, URLs, the `@opencode-ai/*` scope, package names, and legacy-cleanup paths.
- Never change existing English copy or English i18n keys to facilitate translation. English is the semantic source of truth; adapt locale translations around it.
- Use Unicode CLDR, Microsoft/Apple/Mozilla localization style guides, and the relevant Persian language authority (e.g. Persian Academy) to verify terminology — do not translate from model knowledge alone.

**Brand**

- Don't rename the `@opencode-ai/*` scope by hand — there are ~1,300 file references. Script it, then manual QA.
- Keep the original MIT copyright notice from `sst/opencode` in `LICENSE`. A `NOTICE` / `THIRD-PARTY-LICENSES` file is required by the MIT license — preserve it even though the product name and logo change.

**Tests**

- Run tests from each package directory, never from the repo root.
- For Effect-touching tests, use `testEffect(...)` from `packages/opencode/test/lib/effect.ts`.
- Keep provider tests fixture-first; live calls stay behind `RECORD=true` and API-key checks.

---

## 7. Mobarrez Code fork-specific roadmap

See [`mobarrez-code-build-plan.md`](./mobarrez-code-build-plan.md) for the full phased plan (rebrand → model gateway → billing → desktop → MCP → test & ship). Quick map:

- **Phase 1 — Rebrand**: replace `packages/identity/` logos and `packages/desktop/icons/{dev,beta,prod}/`; script the `@opencode-ai/*` → new scope rename (~1,300 references); repoint the `publish` block in `electron-builder.config.ts` away from `owner: "anomalyco"`.
- **Phase 2 — Model gateway**: wire `packages/llm` default config to a local gateway instead of user-supplied API keys; route cheap-vs-expensive models behind credit weighting; turn on prompt caching (already supported — `cache: "auto"` by default).
- **Phase 3 — Billing**: ZarinPal (Toman) integration; pricing tiers with **hard usage caps**; `packages/console` is the reference architecture, not a copy target.
- **Phase 4 — Desktop**: prioritize the Electron app as the primary surface; add Persian strings + `dir="rtl"` in `packages/app`. Treat the TUI as secondary.
- **Phase 5 — MCP**: verify the existing MCP client (stdio + remote SSE + OAuth) still works after the rename; curate starter MCP servers.
- **Phase 6 — Test & ship**: full QA pass; beta with real users to replace placeholder usage-band assumptions with real token data.

---

## 8. Where to read next

- [`README.md`](./README.md) — user-facing overview.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — how to contribute, PR expectations, style preferences.
- [`SECURITY.md`](./SECURITY.md) — threat model and disclosure.
- [`AGENTS.md`](./AGENTS.md) — the enforced style guide for agents working in this repo.
- [`packages/opencode/AGENTS.md`](packages/opencode/AGENTS.md) — Effect rules, module shape, DB/migration rules.
- [`packages/llm/AGENTS.md`](packages/llm/AGENTS.md) — LLM architecture, routes, protocols, recording tests.
- [`packages/app/AGENTS.md`](packages/app/AGENTS.md) — SolidJS + localization rules for the web UI.
- [`packages/desktop/AGENTS.md`](packages/desktop/AGENTS.md) — Electron IPC, i18n for native menus.
- [`packages/ui/AGENTS.md`](packages/ui/AGENTS.md) — shared UI component conventions.
- [`packages/opencode/specs/effect/`](packages/opencode/specs/effect/) — Effect migration patterns.

---

_Mobarrez Code is a fork of `sst/opencode` (MIT). The MIT copyright notice is preserved in [`LICENSE`](./LICENSE)._
