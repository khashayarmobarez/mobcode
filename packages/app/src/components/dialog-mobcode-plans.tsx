import { DialogBody, DialogHeader, DialogTitle, DialogV2 } from "@opencode-ai/ui/v2/dialog-v2"
import { Icon } from "@opencode-ai/ui/v2/icon"
import { ProviderIcon } from "@opencode-ai/ui/provider-icon"
import { Tag } from "@opencode-ai/ui/v2/badge-v2"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { useTheme } from "@opencode-ai/ui/theme"
import { createResource, createMemo, Show, type Component, For } from "solid-js"
import { useLocal } from "@/context/local"
import { useProviders } from "@/hooks/use-providers"
import { decode64 } from "@/utils/base64"
import { useLanguage } from "@/context/language"
import { MobCode } from "@opencode-ai/core/billing/mobcode"

type ModelState = ReturnType<typeof useLocal>["model"]
const featuredProviders = ["openai", "anthropic", "google", "github-copilot"]

export const DialogMobCodePlans: Component<{ model?: ModelState }> = (props) => {
  const local = useLocal()
  const model = props.model ?? local.model
  const dialog = useDialog()
  const theme = useTheme()
  const directory = () => decode64(local.slug())
  const providers = useProviders(directory)
  const language = useLanguage()
  const fa = () => language.locale() === "fa"
  const client = createMemo(() => MobCode.billingClient())

  const [plans] = createResource(() => client().plans())
  const [account] = createResource(() => client().account())
  const checkoutUrl = createMemo(() => MobCode.CHECKOUT_URL_FALLBACK)

  const openProviders = (provider?: string) => {
    void import("./dialog-connect-provider").then((x) => {
      const controller = x.useProviderConnectController()
      controller.select(provider)
      void dialog.show(() => <x.DialogConnectProvider controller={controller} directory={directory} />)
    })
  }

  let listEl: HTMLDivElement | undefined
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    if (!listEl) return
    const buttons = Array.from(listEl.querySelectorAll<HTMLButtonElement>("button"))
    if (buttons.length === 0) return
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next = index < 0 ? (e.key === "ArrowDown" ? 0 : buttons.length - 1) : index + (e.key === "ArrowDown" ? 1 : -1)
    buttons[(next + buttons.length) % buttons.length]?.focus()
    e.preventDefault()
  }
  document.addEventListener("keydown", handleKeyDown)
  const cleanup = () => document.removeEventListener("keydown", handleKeyDown)
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", cleanup)
  }

  const insufficient = () => account.state === "ready" && account().connected && account().credits <= 0

  return (
    <DialogV2
      fit
      containerClass="!h-auto max-h-[calc(100vh_-_16px)] !w-[min(calc(100vw_-_16px),640px)]"
      class="[font-family:var(--v2-font-family-sans)] [&_[data-slot=dialog-header]]:!px-5 [&_[data-slot=dialog-header-title]]:!text-[15px] [&_[data-slot=dialog-header-title]]:!tracking-[-0.13px]"
    >
      <DialogHeader closeLabel={language.t("common.close")}>
        <DialogTitle>{language.t("dialog.mobcode.plans.title")}</DialogTitle>
      </DialogHeader>
      <DialogBody class="max-h-[calc(100vh_-_68px)] min-h-0 flex-none gap-0 overflow-y-auto px-2 pb-2">
        <div ref={listEl} class="flex min-h-0 flex-col">
          <Show when={insufficient()}>
            <div class="m-2 rounded-md border-[0.5px] border-v2-border-border-muted bg-v2-background-bg-layer-02 p-3 text-[13px] text-v2-text-text-base">
              {language.t("dialog.mobcode.plans.insufficient")}
            </div>
          </Show>

          <div data-section="plans" class="flex w-full flex-col items-start pb-3">
            <div class="flex h-8 w-full flex-none select-none flex-row items-center px-3 pb-2">
              <div class="flex h-5 items-center text-[13px] font-[440] leading-5 tracking-[-0.04px] text-v2-text-text-muted">
                {language.t("dialog.mobcode.plans.section")}
              </div>
            </div>
            <For each={plans.state === "ready" ? plans() : []}>
              {(plan) => (
                <div
                  class="mx-1 mb-1.5 flex w-full flex-col gap-2 rounded-lg border-[0.5px] border-v2-border-border-muted bg-v2-background-bg-layer-02 p-3"
                  classList={{ "border-v2-border-border-strong": plan.popular }}
                >
                  <div class="flex w-full flex-row items-center justify-between">
                    <div class="flex flex-row items-center gap-2">
                      <span class="text-[14px] font-[590] text-v2-text-text-base">{fa() ? plan.nameFA : plan.nameEN}</span>
                      <Show when={plan.popular}>
                        <Tag>{language.t("dialog.mobcode.plans.popular")}</Tag>
                      </Show>
                    </div>
                    <span class="text-[13px] font-[530] text-v2-text-text-base" dir="ltr">
                      {MobCode.formatToman(plan.priceToman, fa() ? "fa" : "en")}
                    </span>
                  </div>
                  <ul class="m-0 flex list-none flex-col gap-1 p-0">
                    <For each={plan.featuresFA}>
                      {(feature) => (
                        <li class="flex flex-row items-center gap-1.5 text-[12.5px] font-[440] text-v2-text-text-muted">
                          <Icon name="check" class="size-3.5 shrink-0 text-v2-icon-icon-base" />
                          <span>{feature}</span>
                        </li>
                      )}
                    </For>
                  </ul>
                  <a
                    href={checkoutUrl()}
                    target="_blank"
                    rel="noreferrer"
                    class="flex h-8 w-full items-center justify-center rounded-md bg-v2-fill-fill-accent text-[13px] font-[530] text-white no-underline"
                  >
                    {language.t("dialog.mobcode.plans.buy")}
                  </a>
                </div>
              )}
            </For>
            <Show when={account.state === "ready" && account().connected}>
              <div class="flex w-full flex-row items-center justify-between px-3 py-1.5 text-[12.5px] text-v2-text-text-muted">
                <span>{language.t("dialog.mobcode.plans.credits")}</span>
                <span dir="ltr">
                  {new Intl.NumberFormat(fa() ? "fa-IR" : "en-US").format(account().credits)}
                </span>
              </div>
            </Show>
          </div>

          <div class="flex w-full flex-col">
            <div class="flex w-full flex-col items-start rounded-lg border-[0.5px] border-v2-border-border-muted bg-v2-background-bg-layer-02 p-2.5 pt-2">
              <div class="flex h-8 w-full select-none items-center px-0.5 pb-2">
                <div class="flex h-5 items-center text-[13px] font-[440] leading-5 tracking-[-0.04px] text-v2-text-text-muted">
                  {language.t("dialog.mobcode.plans.byok")}
                </div>
              </div>
              <div class="grid w-full grid-cols-1 gap-y-1.5 gap-x-2 sm:grid-cols-2">
                <For
                  each={[...providers.popular()]
                    .filter((provider) => featuredProviders.includes(provider.id))
                    .sort((a, b) => featuredProviders.indexOf(a.id) - featuredProviders.indexOf(b.id))}
                >
                  {(provider) => (
                    <button
                      type="button"
                      data-provider-id={provider.id}
                      class="flex min-h-11 w-full scroll-my-3.5 flex-row items-start gap-2 rounded-md bg-v2-background-bg-base px-3 py-2.5 text-left text-[13px] font-[530] leading-5 text-v2-text-text-base hover:bg-v2-background-bg-layer-01 focus:bg-v2-background-bg-layer-01 focus:outline-none"
                      classList={{
                        "border-[0.5px] border-transparent shadow-[var(--v2-elevation-raised)]": theme.mode() !== "dark",
                        "border-[0.5px] border-v2-border-border-strong": theme.mode() === "dark",
                      }}
                      onClick={() => openProviders(provider.id)}
                    >
                      <ProviderIcon id={provider.id} class="mt-0.5 size-4 shrink-0 text-v2-icon-icon-base" />
                      <span class="flex min-w-0 flex-col">
                        <span class="truncate">{provider.name}</span>
                      </span>
                    </button>
                  )}
                </For>
                <button
                  type="button"
                  class="col-span-full flex h-8 w-full scroll-my-3.5 items-center justify-start rounded-md px-3 text-left text-[13px] font-[440] leading-5 text-v2-text-text-muted hover:bg-v2-overlay-simple-overlay-hover focus:bg-v2-overlay-simple-overlay-hover focus:outline-none"
                  onClick={() => openProviders()}
                >
                  {language.t("dialog.model.unpaid.viewMoreProviders")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogBody>
    </DialogV2>
  )
}
