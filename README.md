# Tolou Concrete Driver 3D

بازی سه‌بعدی «طلوع» برای شبیه‌سازی چرخه حمل بتن آماده؛ از کارخانه و بارگیری تا رانندگی، تحویل، تخلیه و بازگشت برای مأموریت بعدی.

## Current release

نسخه جاری محصول: **v0.2.0**

هدف اصلی این نسخه **Windows Desktop Game** است. هسته بازی HTML5/JavaScript/WebGL/Babylon.js باقی مانده و Electron پوسته دسکتاپ، persistence امن و بسته‌بندی Windows را فراهم می‌کند.

## Game loop

`Order → Load → Drive → Park → Deliver → Return → Next Order`

هدف پروژه ساخت یک بازی Arcade/Light Simulation است، نه صرفاً نمایش یک کامیون سه‌بعدی. بازیکن تحت محدودیت زمان، کیفیت بتن، سلامت خودرو و دقت تحویل تصمیم می‌گیرد.

## Technology

- HTML5 / CSS / JavaScript
- WebGL
- Babylon.js
- Electron
- electron-builder / NSIS
- GitHub Actions

Renderer دسترسی مستقیم Node.js یا filesystem ندارد. عملیات دسکتاپ از طریق preload محدود و IPC کنترل‌شده انجام می‌شود.

## Windows development

نیازمندی: Node.js 22 یا جدیدتر.

```bash
npm install
npm run electron:dev
```

این دستور Babylon.js را از package نصب‌شده به `vendor/babylon.js` کپی می‌کند و بازی را داخل Electron اجرا می‌کند. نسخه desktop در runtime به CDN وابسته نیست.

## Windows package smoke build

```bash
npm run pack
```

## Windows x64 installer

```bash
npm run dist:win
```

خروجی در `dist/` ساخته می‌شود و نام installer به‌شکل زیر است:

```text
TolouConcreteDriver-Setup-x.y.z.exe
```

## Browser development

وب همچنان برای تست سریع قابل استفاده است:

```bash
npm install
npm run vendor:sync
python -m http.server 8080
```

سپس:

```text
http://localhost:8080
```

اگر `vendor/babylon.js` موجود نباشد، نسخه وب برای compatibility به CDN Babylon fallback می‌کند. Build ویندوز همیشه vendor محلی را ایجاد می‌کند.

## Persistence

لایه platform-neutral فعال است:

```text
Game Renderer
    ↓
TolouPersistence
    ├── ElectronPersistenceAdapter → secure IPC → filesystem
    └── BrowserPersistenceAdapter  → localStorage
```

در Electron، saveها زیر مسیر استاندارد `app.getPath('userData')/saves` ذخیره می‌شوند. نام slotها whitelist شده، اندازه payload محدود است و save قبلی به‌عنوان backup نگهداری می‌شود.

در v0.2.0 persistence دیگر فقط foundation نیست و به چرخه واقعی بازی متصل است. قابلیت‌های فعال شامل موارد زیر است:

- autosave و Continue
- restore دقیق مأموریت و order فعال
- persistence جداگانه career/profile
- صف serialized برای Save/Load/Remove هر slot
- محافظت New Game / Restart در برابر overwrite ناخواسته checkpoint قابل بازیابی
- نگهداری Game Over terminal result جدا از autosave قابل بازیابی
- حفظ داده کاربر هنگام uninstall بر اساس NSIS configuration

## Gameplay systems in v0.2.0

- Windows / Electron desktop foundation
- Save / Load / Continue
- controlled shutdown persistence
- collision system
- GPS / mini-map
- loading and delivery operation polish
- deterministic concrete quality model V1
- career progression V1
- deterministic orders engine and runtime integration
- Windows NSIS installer validation
- installed Windows UAT gate

## Controls

- `W / ArrowUp` گاز
- `S / ArrowDown` ترمز / دنده عقب
- `A / D` یا `ArrowLeft / ArrowRight` فرمان
- `Space` ترمز دستی
- `E` عملیات: بارگیری / تحویل / دریافت مأموریت بعدی
- `C` تغییر دوربین
- `R` ریست کامیون

## Release validation

Release Candidate ویندوز باید از این گیت‌ها عبور کند:

1. static checks و regression tests
2. ساخت NSIS installer واقعی
3. نصب silent در Windows CI
4. اجرای نسخه نصب‌شده و تأیید renderer boot
5. uninstall smoke validation
6. Installed Windows UAT واقعی

جزئیات معماری در [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) آمده است.
