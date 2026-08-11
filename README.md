<p align="center">
  <a href="https://opencode.ai">
    <picture>
      <source srcset="packages/identity/mark-light.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/identity/mark.svg" media="(prefers-color-scheme: light)">
      <img src="packages/identity/mark.svg" alt="Mobarrez Code logo" width="120">
    </picture>
  </a>
</p>
<h1 align="center">Mobarrez Code</h1>
<p align="center">دستیار هوشمند کدنویسی — فارسی، راست‌چین، با صورتحساب به تومان</p>
<p align="center"><em>The Persian-localized AI coding agent — Toman-billed, gateway-wired.</em></p>

<p align="center">
  <a href="https://www.npmjs.com/package/opencode-ai"><img alt="npm" src="https://img.shields.io/npm/v/opencode-ai?style=flat-square" /></a>
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
  <a href="./DEVELOPMENT.md"><img alt="Dev guide" src="https://img.shields.io/badge/dev-guide-DEVELOPMENT.md-orange?style=flat-square" /></a>
</p>

<p align="center">
  <a href="README.md">فارسی (Persian)</a> |
  <a href="README.en.md">English</a>
</p>

---

## دربارهٔ پروژه

**مُبَرِّز کد** یکی از فورک‌های پروژه‌ی متن‌باز [`sst/opencode`](https://github.com/sst/opencode) (با مجوز MIT) است که برای کاربران ایرانی بومی‌سازی شده است. هدف این پروژه ارائه یک نمای نیرومند هوش مصنوعی برای کدنویسی است که:

- رابط کاربری و پیام‌ها به **فارسی** و راست‌چین (RTL) باشد.
- به یک **دروازهٔ محلی مدل** (Model Gateway) متصل شود تا از کلیدهای API کاربر مستقل باشد.
- **صورتحساب به تومان** داشته باشد و سطح استفاده بر اعتبار مدل بستگی داشته باشد.
- یک اپلیکیشن دسکتاپ (Electron) و یک CLI ترمینالی را در کنار هم پشتیبانی کند.

متن اصلی در `packages/identity/` (نشانه‌ها) قرار دارد؛ در صورت بازنگری نشانه، فایل‌های درون `packages/desktop/icons/{dev,beta,prod}/` هم باید همگام شوند.

---

## نصب

> [!NOTE]
> بسته‌های انتشار برای Mobarrez Code هنوز در حال توسعه‌اند. در حال حاضر می‌توانید از سورس بیلد بگیرید یا از نسخهٔ اصلی `opencode-ai` استفاده کنید تا انتشار اولیه آمده شود.

### از سورس (توسعه)

```bash
bun install      # نصب وابستگی‌ها
bun dev          # اجرای TUI در packages/opencode
bun dev .        # اجرای TUI در ریشهٔ همین مخزن
```

### اپ دسکتاپ (BETA)

```bash
# اجرای اپ Electron در حالت توسعه
bun run --cwd packages/desktop dev

# بیلد و بسته‌بندی
bun run --cwd packages/desktop build
bun run --cwd packages/desktop package
```

| پلتفرم             | فایل خروجی                           |
| ------------------ | ------------------------------------ |
| macOS (Apple Silicon) | `opencode-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `opencode-desktop-mac-x64.dmg`     |
| Windows               | `opencode-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm`, یا `.AppImage`     |

---

## agent ها

این پروژه از دو agent داخلی استفاده می‌کند که با کلید `Tab` بینشان جابه‌جا می‌شوید:

- **build** — پیش‌فرض، دسترسی کامل برای کارهای توسعه
- **plan** — فقط خواندنی، برای کاوش و تحلیل کد (به‌صورت پیش‌فرض اجازهٔ ویرایش فایل نمی‌دهد)

یک زیرagent **general** نیز برای جستجوهای پیچیده وجود دارد و با `@general` فراخوانی می‌شود.

---

## مستندات

برای راهنمای کامل گسترش و تست، به [**DEVELOPMENT.md**](./DEVELOPMENT.md) مراجعه کنید.

برای نسخهٔ اصلی مستندات پروژهٔ بالادستی، به [https://opencode.ai/docs](https://opencode.ai/docs) مراجعه کنید.

---

## مشارکت

اگر به Mobarrez Code علاقه به مشارکت دارید، لطفاً [راهنمای مشارکت](./CONTRIBUTING.md) را بخوانید و سپس Pull Request ارسال کنید.

برای کار روی پروژه‌ای که از نام "opencode" یا "Mobarrez Code" استفاده می‌کند (مانند "opencode-dashboard")، یادداشتی به README خود بیفزایید تا واضح باشد که این پروژه توسط تیم Mobarrez Code تأیید نشده است.

---

## تمام‌نظر (License)

این پروژه تحت مجوز **MIT** است. کپی اصلی پیش از فورک در [`sst/opencode`](https://github.com/sst/opencode) نگه داشته شده و حق نشر MIT آن در فایل [`LICENSE`](./LICENSE) باقی مانده است.

> Copyright (c) 2025 opencode
> Copyright (c) 2025 Mobarrez Code contributors

هیچ تغییری در مجوز داده نشده و همهٔ شرایط MIT حفظ شده‌ است.