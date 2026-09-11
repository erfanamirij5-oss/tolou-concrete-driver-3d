# Tolou Concrete Driver 3D

بازی سه‌بعدی «طلوع» برای شبیه‌سازی چرخه حمل بتن آماده؛ از کارخانه و بارگیری تا رانندگی، تحویل، تخلیه و بازگشت برای مأموریت بعدی.

## Product target

هدف اصلی محصول از این نسخه به بعد **Windows Desktop Game** است. هسته بازی همچنان HTML5/JavaScript/WebGL/Babylon.js باقی می‌ماند و Electron پوسته دسکتاپ، دسترسی امن به persistence و بسته‌بندی Windows را فراهم می‌کند.

## Game loop

`Order → Load → Drive → Park → Deliver → Return → Next Order`

هدف پروژه ساخت یک بازی Arcade/Light Simulation است، نه صرفاً نمایش یک کامیون سه‌بعدی. بازیکن باید تحت محدودیت زمان، کیفیت بتن، سلامت خودرو و دقت تحویل تصمیم بگیرد.

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

دستور بالا Babylon.js را از package نصب‌شده به `vendor/babylon.js` کپی می‌کند و بازی را داخل Electron اجرا می‌کند. نسخه desktop در runtime به CDN وابسته نیست.

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

## Persistence foundation

لایه platform-neutral اضافه شده است:

```text
Game Renderer
    ↓
TolouPersistence
    ├── ElectronPersistenceAdapter → secure IPC → filesystem
    └── BrowserPersistenceAdapter  → localStorage
```

در Electron، فایل‌های save زیر مسیر استاندارد `app.getPath('userData')/saves` ذخیره می‌شوند. نام slotها whitelist شده، اندازه payload محدود است و save قبلی به‌عنوان backup نگهداری می‌شود.

> این branch فقط foundation persistence را فراهم می‌کند. اتصال state واقعی بازی، Continue، autosave و restore دقیق مأموریت در milestone بعدی (`feat/save-load-v1`) انجام می‌شود.

## Controls

- `W / ArrowUp` گاز
- `S / ArrowDown` ترمز / دنده عقب
- `A / D` یا `ArrowLeft / ArrowRight` فرمان
- `Space` ترمز دستی
- `E` عملیات: بارگیری / تحویل / دریافت مأموریت بعدی
- `C` تغییر دوربین
- `R` ریست کامیون

## Development order

1. Windows / Electron foundation
2. Save / Load / Continue
3. Pause / controlled shutdown
4. Truck Physics V2
5. Collision system
6. GPS / mini-map
7. Concrete gameplay model
8. Missions / progression
9. Visual and audio polish

جزئیات معماری در [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) آمده است.
