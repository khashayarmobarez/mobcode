# Mobarrez Code — Agent Instructions

Fork of [`sst/opencode`](https://github.com/sst/opencode) (MIT), rebranded as **Mobarrez Code**.
Persian-localized AI coding agent with Toman billing, wired to a local model gateway.

## Tech Stack

- **Runtime:** Bun (not Node)
- **Language:** TypeScript
- **Desktop:** Electron (`packages/desktop` + `packages/app`)
- **CLI:** Terminal-based (`packages/opencode`)
- **LLM integration:** `packages/llm`
- **Monorepo:** Bun workspaces

## Build & Test

```sh
bun install          # install all workspace dependencies
bun run typecheck    # run TypeScript type checking
bun run lint         # run linting
bun run test         # run tests
```

Before committing, always run `bun run typecheck` and `bun run lint`.

## Project Structure

| Directory          | Purpose                              |
| ------------------ | ------------------------------------ |
| `packages/opencode` | CLI binary, terminal UI             |
| `packages/app`     | Web UI rendered inside Electron     |
| `packages/desktop` | Electron shell + builder config     |
| `packages/llm`     | Model gateway / LLM integration     |
| `packages/console` | Billing backend (reference only)    |
| `packages/ui`      | Shared UI components                |
| `packages/identity`| Logo assets and brand marks         |
| `packages/docs`    | Documentation                       |

## Conventions

- No comments unless necessary — code should be self-documenting.
- Follow existing patterns in sibling files. Do not introduce new patterns without a reason.
- Persian strings use `rtl` layout. All user-facing text should be in Persian.
- Config filename stays as `opencode.json` — do not rename it.
- **Data separation (planned):** separating MobCode's config/data dirs from a real opencode install (`mobcode.json`, `~/.mobcode*`, `.mobcode/`) is documented in [`DATA_SEPARATION.md`](./DATA_SEPARATION.md). Do not start it without following that plan — a partial attempt breaks ~30 config/plugin tests.
- Keep the original MIT copyright notice from `sst/opencode` in `NOTICE` / `THIRD-PARTY-LICENSES`.
- Scope rename: `@opencode-ai/*` → target scope. Script it, then manual QA — ~1,300 file references.
