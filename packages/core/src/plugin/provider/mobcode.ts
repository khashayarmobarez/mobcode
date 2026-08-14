import { Effect } from "effect"
import { define } from "../internal"
import { DISABLED_DEFAULT_PROVIDERS } from "../../billing/mobcode"

export const MobCodePlugin = define({
  id: "mobcode",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.catalog.transform(
      Effect.fn(function* (catalog) {
        for (const item of catalog.provider.list()) {
          if (!DISABLED_DEFAULT_PROVIDERS.includes(item.provider.id)) continue
          catalog.provider.remove(item.provider.id)
        }
      }),
    )
  }),
})
