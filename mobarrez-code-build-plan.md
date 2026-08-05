# Mobarrez Code — Build & Launch initial Plan

Fork of `sst/opencode` (MIT), rebranded, wired to a local model gateway, billed in Toman.
Steps are tagged **[You]** for account/legal/business actions only a human can do, and
**[Agent]** for work your coding agent can execute directly in the repo.

---

## Phase 0 — Setup

- [ ] **[You]** Fork `sst/opencode` to your own git hosting. Full clone, full history —
  ```
  not a shallow or partial checkout (workspace dependencies make partial checkouts break,
  and you need full history to merge upstream fixes later).
  ```
- [ ] **[Agent]** Add upstream remote and confirm `bun install` runs clean:
  ```

  ```
  git remote rename origin upstream
  git remote add origin <your-fork-url>
  bun install
  ```

  ```
- [ ] **[You]** Decide product slug (binary name, npm scope, domain) — e.g. `mobarrezcode`.
- [ ] **[You]** Start the slow accounts now, in parallel with dev work — these have long lead times:
  - ZarinPal (or equivalent) merchant account for Toman billing
  - Apple Developer Program account (macOS code signing)
  - Windows code-signing certificate
  - Domain + ArvanCloud (or similar) setup for mirroring installers/releases locally

---

## Phase 1 — Rebrand the fork

- [ ] **[Agent]** Replace the six files in `packages/identity/` (logo marks, all sizes) with
  ```
  Mobarrez Code assets.
  ```
- [ ] **[Agent]** Replace `packages/desktop/icons/{dev,beta,prod}/` with your app icons.
- [ ] **[Agent]** Script the rename across `package.json` files: root `name`/`description`,
  ```
  `packages/opencode` `name` + `bin` entry, `@opencode-ai/*` scope → your scope
  (~1,300 file references — scripted, then a manual QA pass, not manual editing).
  ```
- [ ] **[Agent]** Update `packages/desktop/electron-builder.config.ts`: `productName` per
  ```
  channel, `appId`, `homepage`.
  ```
- [ ] **[Agent]** Repoint the `publish` block in `electron-builder.config.ts` from
  ```
  `owner: "anomalyco", repo: "opencode"` to your own release target — otherwise the
  built app checks for updates against the real opencode's GitHub releases.
  ```
- [ ] **[Agent]** Add a `NOTICE` / `THIRD-PARTY-LICENSES` file preserving the original
  ```
  `Copyright (c) 2025 opencode` MIT notice from the root `LICENSE`. Required by the
  license, not optional — keep it even though the product name and logo change.
  Also keep the separate `LICENSE` files under `packages/ui`, `packages/http-recorder`,
  `packages/docs` if you ship those packages.
  ```
- [ ] **[You]** Decision: keep the config filename as `opencode.json` (recommended — it's
  ```
  wired deep into config resolution, and renaming it breaks compatibility with every
  doc/example a user might reference for zero user-facing benefit).
  ```

---

## Phase 2 — Model gateway

- [ ] **[Agent]** In `packages/llm`, wire default provider config to your own gateway
  ```
  instead of requiring user-supplied API keys.
  ```
- [ ] **[You + Agent]** Model routing policy:

  | Tier                | Default model        | Notes                                                              |
  | ------------------- | -------------------- | ------------------------------------------------------------------ |
  | Included / low-cost | DeepSeek V4 Flash    | ~$0.14/$0.28 per 1M tokens — cheap enough to be the baseline       |
  | Metered / top-up    | GLM-5.2 (or similar) | ~10x more expensive per token — gate behind credits, never default |

- [ ] **[Agent]** Implement a credit-weighted usage system (cheap models cost fewer
  ```
  credits, expensive ones cost more) instead of flat unlimited access.
  ```
- [ ] **[Agent]** Implement prompt caching for repeated system prompts / unchanged file
  ```
  context — meaningfully cuts light/medium-user cost.
  ```
- [ ] **[You]** Decide aggregator vs. direct billing: OpenRouter adds a 5.5% card-purchase
  ```
  fee and a 5% BYOK fee past 1M requests/month — go direct to DeepSeek/Z.AI once volume
  justifies the integration work.
  ```

---

## Phase 3 — Billing & subscriptions

- [ ] **[Agent]** Build the ZarinPal integration for Toman billing.
- [ ] **[You + Agent]** Implement pricing tiers with **hard usage caps** (not unlimited —

  ```
  the margin only works if heavy users are capped or routed to top-ups):
  ```

  | Tier     | Price                 | Usage cap              |
  | -------- | --------------------- | ---------------------- |
  | Entry    | ~300,000–450,000 T/mo | Light band only        |
  | Standard | ~700,000–900,000 T/mo | Light–medium band      |
  | Overage  | Metered top-up        | Anything past standard |

- [ ] **[Agent]** Build account/auth + subscription management. `packages/console` in the
  ```
  original repo is opencode's own hosted billing backend (SST/Cloudflare-based) —
  worth reading as a reference architecture, not something to drag along as-is.
  ```
- [ ] **[You]** Set a fixed repricing cadence (quarterly), pegged to a smoothed FX average —
  ```
  not daily, and not a static price for a full year.
  ```

---

## Phase 4 — Desktop app

- [ ] **[Agent]** Confirm the Electron build (`packages/desktop` + `packages/app`) runs
  ```
  from your fork after the Phase 1 rename.
  ```
- [ ] **[Agent]** Localize `packages/app`: Persian strings, `dir="rtl"` layout — this is a
  ```
  normal Chromium web view, so this is the same work as your existing Next.js sites.
  ```
- [ ] **[You]** Apply code signing once Apple/Windows credentials from Phase 0 are in hand —
  ```
  unsigned builds get blocked by Gatekeeper/SmartScreen and will kill adoption.
  ```
- [ ] **[You]** Prioritize desktop as the primary surface, TUI as secondary — your audience
  ```
  (Mobarrez viewers, students, mid-level devs) fits a GUI onboarding better than a
  terminal-first one.
  ```

---

## Phase 5 — MCP & distribution

- [ ] **[Agent]** Verify MCP client works unmodified after the rebrand (it's already a
  ```
  first-class feature — stdio + remote SSE + OAuth — no reimplementation needed).
  ```
- [ ] **[Agent]** Curate a starter set of MCP servers to bundle/recommend for onboarding.
- [ ] **[You]** Set up release distribution mirrored through your own infrastructure
  ```
  (ArvanCloud), not solely GitHub Releases, so installs/updates are actually reachable
  for your users.
  ```

---

## Phase 6 — Test & ship

- [ ] **[Agent]** Full QA pass over the rename (build, run, update-check, MCP connect,
  ```
  billing flow end-to-end).
  ```
- [ ] **[You]** Beta with real users specifically to replace the placeholder usage-band
  ```
  assumptions in the pricing model with real token-usage data before locking prices.
  ```
- [ ] **[You]** Launch at the Phase 3 anchor pricing, revisit on the quarterly cadence.
