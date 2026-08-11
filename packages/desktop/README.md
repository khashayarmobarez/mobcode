# Mobarrez Code Desktop

The Mobarrez Code Desktop app, built with Electron. It is a fork of the upstream `opencode` desktop app and wraps the web UI in `packages/app`.

> [!NOTE]
> Per the [AGENTS.md](./AGENTS.md) rules: never hardcode user-visible English strings in production code — always use an i18n key. Persian (`fa`) is the primary locale for Mobarrez Code; treat English as designer-written source copy.

## Development

```bash
bun install
bun dev
```

Or, scoped to this package:

```bash
bun run --cwd packages/desktop dev
```

## Build

Run the `build` script to build the app's JS assets, then `package` to
bundle the assets as an application. The resulting app will be in `dist/`.

```bash
bun run build && bun run package
```

Platform-specific packaging:

```bash
bun run package:mac     # macOS
bun run package:win     # Windows
bun run package:linux   # Linux
```

## Icons

App icons live under `packages/desktop/icons/{dev,beta,prod}/`. When you rebrand the logo assets in `packages/identity/`, regenerate the desktop icons to keep them in sync. See [icons/README.md](./icons/README.md) for the icon-generation process.

## Rebrand checklist (fork-specific)

If you fork Mobarrez Code further:

- Update `electron-builder.config.ts`: `productName` per channel, `appId`, `homepage`.
- Repoint the `publish` block from `owner: "anomalyco", repo: "opencode"` to your own release target, otherwise the built app checks for updates against the upstream GitHub releases.
- Replace the icons under `packages/desktop/icons/{dev,beta,prod}/` with your own.