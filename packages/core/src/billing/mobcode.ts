export * as MobCode from "./mobcode"

export interface Plan {
  readonly id: "entry" | "standard" | "topup"
  readonly nameFA: string
  readonly nameEN: string
  readonly priceToman: number
  readonly credits: number
  readonly featuresFA: readonly string[]
  readonly popular?: boolean
}

export interface TopUpPack {
  readonly id: string
  readonly credits: number
  readonly priceToman: number
}

export interface Account {
  readonly connected: boolean
  readonly credits: number
  readonly usedThisCycle: number
  readonly planID?: Plan["id"]
  readonly resetAt?: number
}

export const DISABLED_DEFAULT_PROVIDERS: readonly string[] = ["opencode", "opencode-go"]

export const PLANS: readonly Plan[] = [
  {
    id: "entry",
    nameFA: "پایه",
    nameEN: "Entry",
    priceToman: 350_000,
    credits: 100_000,
    featuresFA: ["مدل‌های سبک و اقتصادی", "۱۰۰٬۰۰۰ اعتبار ماهانه", "مناسب کارهای روزمره کدنویسی"],
  },
  {
    id: "standard",
    nameFA: "استاندارد",
    nameEN: "Standard",
    priceToman: 800_000,
    credits: 400_000,
    featuresFA: ["دسترسی به همه مدل‌ها", "۴۰۰٬۰۰۰ اعتبار ماهانه", "مناسب پروژه‌های جدی و حرفه‌ای"],
    popular: true,
  },
]

export const TOP_UP_PACKS: readonly TopUpPack[] = [
  { id: "topup-100k", credits: 100_000, priceToman: 300_000 },
  { id: "topup-300k", credits: 300_000, priceToman: 800_000 },
  { id: "topup-1m", credits: 1_000_000, priceToman: 2_500_000 },
]

export const CHECKOUT_URL_FALLBACK = "https://mobcode.ir/plans"

export function formatToman(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(value) + (locale === "fa" ? " تومان" : " T")
}

export interface BillingClient {
  readonly plans: () => Promise<readonly Plan[]>
  readonly account: () => Promise<Account>
}

const stubAccount: Account = { connected: false, credits: 0, usedThisCycle: 0 }

export const stubBillingClient: BillingClient = {
  plans: () => Promise.resolve(PLANS),
  account: () => Promise.resolve(stubAccount),
}

export function billingClient(): BillingClient {
  const url = process.env.MOBCODE_API_URL
  if (!url) return stubBillingClient
  return {
    plans: async () => {
      const res = await fetch(`${url}/api/plans`)
      if (!res.ok) throw new Error(`MobCode billing: plans request failed (${res.status})`)
      return (await res.json()) as Plan[]
    },
    account: async () => {
      const token = process.env.MOBCODE_API_TOKEN
      const res = await fetch(`${url}/api/account`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`MobCode billing: account request failed (${res.status})`)
      return (await res.json()) as Account
    },
  }
}
