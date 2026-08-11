# Contributing to Mobarrez Code

ما مایلیم مشارکت در **Mobarrez Code** برایتان آسان باشد. تغییراتی بیشتر پیشینه ادغام می‌شوند:

- رفع باگ
- افزودن LSP / Formatter
- بهبود کارایی LLM
- پشتیبانی از provider های جدید
- رفع مشکلات محیط‌ خاص
- رفتار استاندارد گمشده
- بهبود مستندات

اما هر تغییر UI یا ویژگی محصولات اصلی باید پیش از پیاده‌سازی از طریق بازبینی طراحی با تیم اصلی عبور کند.

اگر مطمئن نیستید که PR شما پذیرفته می‌شود، خوشحال می‌شویم با نگه‌دارنده یا پیگیری issue با یکی از label های: `help wanted` / `good first issue` / `bug` / `perf` مشورت کنید.

> [!NOTE]
> PR هایی که این محدودیت‌ها را نادیده می‌گیرند، احتمالاً بسته خواهند شد.

Want to take on an issue? Leave a comment and a maintainer may assign it to you unless it is something we are already working on.

## Adding New Providers

Provider های جدید نباید نیاز به تغییرات کد زیاد (یا ANY) داشته باشند. اگر می‌خواهید پشتیبانی یک provider جدید اضافه کنید، اول PR به:
https://github.com/anomalyco/models.dev

## Developing Mobarrez Code

- Requirements: Bun 1.3+
- Install dependencies and start the dev server from the repo root:

  ```bash
  bun install
  bun dev
  ```

For a deeper walkthrough of each package and how to test them, see [**DEVELOPMENT.md**](./DEVELOPMENT.md).

### Running against a different directory

By default, `bun dev` runs Mobarrez Code in the `packages/opencode` directory. To run it against a different directory or repository:

```bash
bun dev <directory>
```

To run it in the root of the repo itself:

```bash
bun dev .
```

### Building a "localcode"

To compile a standalone executable:

```bash
./packages/opencode/script/build.ts --single
```

Then run it with:

```bash
./packages/opencode/dist/opencode-<platform>/bin/opencode
```

Replace `<platform>` with your platform (e.g., `darwin-arm64`, `linux-x64`).

- Core pieces:
  - `packages/opencode`: Core business logic & server, plus the CLI binary.
  - `packages/opencode/src/cli/cmd/tui.ts`: The TUI entrypoint, written in SolidJS with [opentui](https://github.com/sst/opentui).
  - `packages/tui`: Reusable TUI primitives, contexts, and feature-plugins used by the CLI (SolidJS + opentui).
  - `packages/app`: The shared web UI components, written in SolidJS (rendered inside Electron).
  - `packages/desktop`: The native desktop app, built with Electron (wraps `packages/app`).
  - `packages/llm`: Schema-first LLM core — provider-neutral request/event/tool language.
  - `packages/ui`: Shared web UI components used by both `app` and `tui`.
  - `packages/identity`: Logo and brand mark assets.
  - `packages/plugin`: Source for `@opencode-ai/plugin`.

### Understanding bun dev vs opencode

During development, `bun dev` is the local equivalent of the built `opencode` command. Both run the same CLI interface:

```bash
# Development (from project root)
bun dev --help           # Show all available commands
bun dev serve            # Start headless API server
bun dev web              # Start server + open web interface
bun dev <directory>      # Start TUI in specific directory

# Production
opencode --help          # Show all available commands
opencode serve           # Start headless API server
opencode web             # Start server + open web interface
opencode <directory>     # Start TUI in specific directory
```

### Running the API Server

To start the headless API server:

```bash
bun dev serve
```

This starts the headless server on port 4096 by default. You can specify a different port:

```bash
bun dev serve --port 8080
```

### Running the Web App

To test UI changes during development:

1. **First, start the server** (see [Running the API Server](#running-the-api-server) section above)
2. **Then run the web app:**

```bash
bun run --cwd packages/app dev
```

This starts a local dev server at http://localhost:5173 (or similar port shown in output). Most UI changes can be tested here, but the server must be running for full functionality.

### Running the Desktop App

The desktop app is an Electron application that wraps the web UI.

```bash
bun run --cwd packages/desktop dev        # Run in development
bun run --cwd packages/desktop build      # Production build
bun run --cwd packages/desktop package    # Bundle as an application
```

> [!NOTE]
> If you make changes to the API or SDK (e.g. `packages/opencode/src/server/server.ts`), run `./script/generate.ts` to regenerate the SDK and related files.

Please try to follow the [style guide](./AGENTS.md).

### Setting up a Debugger

Bun debugging is currently rough around the edges. The most reliable way to debug is to run it manually in a terminal via `bun run --inspect=<url> dev ...` and attach your debugger via that URL.

Caveats:

- If you want to run the TUI and have breakpoints triggered in the server code, you might need to run `bun dev spawn` instead of the usual `bun dev`. This is because `bun dev` runs the server in a worker thread and breakpoints might not work there.
- If `spawn` does not work for you, you can debug the server separately:
  - Debug server: `bun run --inspect=ws://localhost:6499/ --cwd packages/opencode ./src/index.ts serve --port 4096`, then attach TUI with `opencode attach http://localhost:4096`
  - Debug TUI: `bun run --inspect=ws://localhost:6499/ --cwd packages/opencode --conditions=browser ./src/index.ts`

Other tips:

- You might want to use `--inspect-wait` or `--inspect-brk` instead of `--inspect`
- Specifying `--inspect=ws://localhost:6499/` on every invocation can be tiresome, you may want to `export BUN_OPTIONS=--inspect=ws://localhost:6499/` instead

#### VSCode Setup

Example configurations live in [.vscode/settings.example.json](.vscode/settings.example.json) and [.vscode/launch.example.json](.vscode/launch.example.json).

Some debug methods that can be problematic:

- Configurations with `"request": "launch"` can have breakpoints incorrectly mapped and thus unusable
- The same problem arises when running in the VSCode `JavaScript Debug Terminal`

## Pull Request Expectations

### Issue First Policy

**All PRs must reference an existing issue.** Before opening a PR, open an issue describing the bug or feature. This helps maintainers triage and prevents duplicate work. PRs without a linked issue may be closed without review.

- Use `Fixes #123` or `Closes #123` in your PR description to link the issue
- For small fixes, a brief issue is fine

### General Requirements

- Keep pull requests small and focused
- Explain the issue and why your change fixes it
- Before adding new functionality, ensure it doesn't already exist elsewhere in the codebase

### UI Changes

If your PR includes UI changes, please include screenshots or videos showing the before and after.

### Logic Changes

For non-UI changes (bug fixes, new features, refactors), explain **how you verified it works**:

- What did you test?
- How can a reviewer reproduce/confirm the fix?

### No AI-Generated Walls of Text

Long, AI-generated PR descriptions and issues are not acceptable and may be ignored. Respect the maintainers' time:

- Write short, focused descriptions
- Explain what changed and why in your own words
- If you can't explain it briefly, your PR might be too large

### PR Titles

PR titles should follow conventional commit standards:

- `feat:` new feature or functionality
- `fix:` bug fix
- `docs:` documentation or README changes
- `chore:` maintenance tasks, dependency updates, etc.
- `refactor:` code refactoring without changing behavior
- `test:` adding or updating tests

You can optionally include a scope to indicate which package is affected:

- `feat(app):` feature in the app package
- `fix(desktop):` bug fix in the desktop package
- `chore(opencode):` maintenance in the opencode package

### Style Preferences

These are not strictly enforced, they are just general guidelines:

- **Functions:** Keep logic within a single function unless breaking it out adds clear reuse or composition benefits.
- **Destructuring:** Do not do unnecessary destructuring of variables.
- **Control flow:** Avoid `else` statements.
- **Error handling:** Prefer `.catch(...)` instead of `try`/`catch` when possible.
- **Types:** Reach for precise types and avoid `any`.
- **Variables:** Stick to immutable patterns and avoid `let`.
- **Naming:** Choose concise single-word identifiers when they remain descriptive.
- **Runtime APIs:** Use Bun helpers such as `Bun.file()` when they fit the use case.

## Feature Requests

For net-new functionality, start with a design conversation. Open an issue describing the problem, your proposed approach (optional), and why it belongs in Mobarrez Code. The core team will help decide whether it should move forward; please wait for that approval instead of opening a feature PR directly.

## Issue Requirements

All issues **must** use one of our issue templates:

- **Bug report** — for reporting bugs (requires a description)
- **Feature request** — for suggesting enhancements (requires verification checkbox and description)
- **Question** — for asking questions (requires the question)

Blank issues are not allowed.