# MobCode Billing

Phase 1 (client shell + stub) and the Phase 2 API contract for the future backend.

## Phase 1 — current state

The client ships with a **static plan catalog** and a **stub billing client** that requires no backend. When `MOBCODE_API_URL` is unset, the stub returns the static catalog and a "not connected" account state.

### Files

- `packages/core/src/billing/mobcode.ts` — types, plan catalog, top-up packs, stub + live `BillingClient`
- `packages/app/src/components/dialog-mobcode-plans.tsx` — plans upsell dialog (Persian, RTL, Toman)
- `packages/core/src/plugin/provider/mobcode.ts` — v2 catalog plugin that removes disabled default providers

### Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `MOBCODE_API_URL` | Base URL of the billing backend. When unset, the stub is used. | — |
| `MOBCODE_API_TOKEN` | Bearer token sent to `/api/account`. | — |

### Plan catalog (placeholder)

| Plan | Price (Toman) | Credits |
| --- | ---: | ---: |
| پایه (Entry) | 350,000 | 100,000 |
| استاندارد (Standard) | 800,000 | 400,000 |
| Top-up 100k | 300,000 | 100,000 |
| Top-up 300k | 800,000 | 300,000 |
| Top-up 1M | 2,500,000 | 1,000,000 |

Edit `PLANS` and `TOP_UP_PACKS` in `mobcode.ts` to change prices.

### Disabled default providers

`DISABLED_DEFAULT_PROVIDERS` in `mobcode.ts` lists `["opencode", "opencode-go"]`. The v2 `MobCodePlugin` removes these from the catalog on every reload (survives upstream refreshes). The v1 `custom()` loader for `opencode` in `packages/opencode/src/provider/provider.ts` returns `autoload: false` with no models.

---

## Phase 2 — backend API contract

When the billing backend and purchase website are ready, set `MOBCODE_API_URL` and the client switches from the stub to live API calls. The backend must implement these endpoints:

### `GET /api/plans`

Returns the plan catalog. Shape matches `Plan[]`:

```json
[
  {
    "id": "entry",
    "nameFA": "پایه",
    "nameEN": "Entry",
    "priceToman": 350000,
    "credits": 100000,
    "featuresFA": ["مدل‌های سبک و اقتصادی", "۱۰۰٬۰۰۰ اعتبار ماهانه", "مناسب کارهای روزمره کدنویسی"],
    "popular": false
  }
]
```

### `GET /api/account`

Returns the authenticated user's account state. Requires `Authorization: Bearer <token>` header. Shape matches `Account`:

```json
{
  "connected": true,
  "credits": 84500,
  "usedThisCycle": 15500,
  "planID": "entry",
  "resetAt": 1735689600000
}
```

When `connected` is `false` or `credits` is `0`, the UI shows the insufficient-credits state and prompts the user to buy a plan.

### `GET /api/checkout` (optional)

Returns a redirect URL to the purchase page on the MobCode website. If unimplemented, the dialog falls back to `CHECKOUT_URL_FALLBACK` (`https://mobcode.ir/plans`).

```json
{ "redirect_url": "https://mobcode.ir/checkout?plan=entry" }
```

### Auth

The client sends `MOBCODE_API_TOKEN` as a Bearer token. The website issues this token when the user logs in; the user sets it via `MOBCODE_API_TOKEN` env var or a future `mobcode auth login` command.

### Future endpoints (Phase 3)

Not needed for Phase 2 but planned:

- `POST /api/proxy/chat/completions` — model proxy with credit enforcement
- `GET /api/usage` — per-session token usage breakdown
- `POST /api/topup` — ZarinPal payment initiation