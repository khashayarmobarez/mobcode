# `packages/opencode`

The core of Mobarrez Code: the CLI binary, the terminal UI (TUI), the headless API server, and most of the agent business logic.

This is a fork of the upstream `packages/opencode` from [`sst/opencode`](https://github.com/sst/opencode) (MIT), rebranded as **Mobarrez Code** for Persian-speaking users. The folder name is kept as `opencode`, but the binary is `mobcode` and config resolution uses `mobcode.json` / `.mobcode/` with global dirs under `~/.config/mobcode`, `~/.local/share/mobcode`, and `~/.cache/mobcode` — fully separated from a real opencode install; see [`DATA_SEPARATION.md`](../../DATA_SEPARATION.md).

## What lives here

- `src/cli/cmd/tui/` — the terminal UI, written in SolidJS with [opentui](https://github.com/sst/opentui).
- `src/server/` — the headless HTTP/SSE API server (default port 4096).
- `src/session/` — session lifecycle, LLM orchestration, and tool execution.
- `src/tool/` — the built-in tools the agent can call (file edits, bash, etc.).
- `src/config/` — config resolution (reads `mobcode.json` / `mobcode.jsonc`).
- `src/plugin/` — plugin loader and runtime.
- `src/mcp/` — Model Context Protocol client (stdio + remote SSE + OAuth).
- `bin/mobcode.cjs` — the CLI entrypoint.

## Run (development)

From the repo root:

```bash
bun dev            # runs the TUI in packages/opencode
bun dev .          # runs the TUI in the repo root
bun dev serve      # start the headless API server on :4096
bun dev web        # start server + open web UI
```

For a full walkthrough of building, testing, and debugging this package, see [../../DEVELOPMENT.md](../../DEVELOPMENT.md) and [../../CONTRIBUTING.md](../../CONTRIBUTING.md).

## Build a standalone binary

```bash
./packages/opencode/script/build.ts --single
```

The output lands in `packages/opencode/dist/opencode-<platform>/bin/opencode`.

## Tests

Tests run from inside the package, never from the repo root:

```bash
bun test --timeout 30000 --only-failures
```

See [test/AGENTS.md](./test/AGENTS.md) and [specs/effect/](./specs/effect/) for the Effect-test patterns and migration specs used here.