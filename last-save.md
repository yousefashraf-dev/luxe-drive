# ZaFah — التوثيق الكامل (آخر تحديث: 1 يونيو 2026)

---

## 🏗️ هيكل المشروع

```
app/
├── page.tsx          # الصفحة الرئيسية — عرض العربيات/المشاوير + فلاتر + بحث + سيرش ذكي
├── login/page.tsx    # تسجيل الدخول (Google Auth + Email/Password)
├── admin/page.tsx    # لوحة تحكم الأدمن (CRUD + نشر/تعليق/حذف + فلاتر تصنيف)
├── add-ad/page.tsx   # إضافة/تعديل إعلان (Stepped Form: Car/Flowers/Trips/Package)
├── my-ads/page.tsx   # إعلانات المستخدم + تعديل + تجديد
├── layout.tsx        # Root layout + SEO metadata + JSON-LD + ErrorBoundary + Twitter Cards + PWA icons
└── globals.css       # تنسيقات + iOS fixes + RTL/LTR font switching

components/
└── ErrorBoundary.tsx  # Class-based error boundary (RTL fallback UI)
└── ChatWidget.tsx     # (مقفول — return null)

lib/
├── AuthContext.tsx    # Google Sign-In + Admin check + persistence
├── LanguageContext.tsx # i18n (عربي/إنجليزي) + localStorage try/catch + RTL/LTR
├── translations.ts   # ~722 سطر — كل النصوص مترجمة (عربي + إنجليزي)
├── firebase.ts       # Firebase config + offline persistence + try/catch
├── useUpload.ts      # Canvas compress → Cloudinary unsigned upload
└── utils.ts          # formatPhone() — بتحوّل 0→20 (مصر)

public/
├── sitemap.xml       # SEO sitemap
├── manifest.json     # PWA manifest (مع أيقونات SVG)
├── robots.txt        # SEO — يسمح للكل، يمنع /admin
├── favicon.svg       # أيقونة الموقع (حرف Z دهبي)
├── icon-192.svg      # PWA icon 192×192
├── icon-512.svg      # PWA icon 512×512
├── google8db74195b4431746.html  # Google Search Console verification
├── f30-refined.jpg   # Hero background (BMW F30)
└── placeholder-car.png

firebase/
├── firestore.rules       # قواعد Firestore — قابلة للنشر
├── firestore.indexes.json # Composite indexes
├── firebase.json         # Firebase project config
└── .firebaserc           # project alias → luxe-drive-db
```

---

## 🔥 Firebase Data Model

**Collection `cars`**:
```ts
{
  name: string,
  price: string,
  description: string,
  image: string[],
  phone: string,
  whatsapp: string,
  bookedDays: string[],
  views: number,
  isVIP: boolean,
  status: 'active' | 'suspended',
  category: 'car_wedding' | 'car_rental' | 'flowers' | 'trip' | 'car_package',
  driver: 'with' | 'without' | 'both' | '',
  location: string,
  fromLocation: string,    // للـ trips
  toLocation: string,      // للـ trips
  packageDetails: string,  // للـ packages
  bouquetName: string,     // للـ flowers
  createdAt: Timestamp,
  updatedAt: Timestamp,
  expiryDate: Timestamp,
  userId: string,
  userEmail: string
}
```

**Collection `favorites`**: `{ userId, carId, createdAt }`

**Document `stats/global`**: `{ total_visits: number }`

---

## 🔥 Firestore Security Rules

```
cars collection:
  read  → anyone
  create → authenticated user (userId must match their auth.uid)
  update → owner (userId) OR admin (yousefgaafer85@gmail.com)
  delete → admin only

favorites: user reads/writes own favorites only
users: user reads/writes own profile, admin reads all
stats: admin write only
```

**Deploy**: `firebase deploy --only firestore --project luxe-drive-db`

---

## 🔄 سير العمل (Workflow)

```
صاحب إعلان يسجل → يرفع (status: suspended)
                      ↓
ADMIN ينشّط من /admin + expiryDate = 30 يوم
                      ↓
الإعلان يظهر قدام الجميع لمدة 30 يوم
                      ↓
my-ads يعرض countdown + auto-suspend بعد expiryDate
                      ↓
صاحب الإعلان → واتساب ADMIN → ADMIN ينشّط تاني (30 يوم جديدة)
```

---

## 🌐 نظام اللغات

- **عربي (افتراضي)** + **إنجليزي** — toggle في النافبار والتبويب الجانبي
- `lib/LanguageContext.tsx` يحفظ آخر لغة في `localStorage` (مع try/catch للـ iOS private browsing)
- `lib/translations.ts` ~660 سطر — كل النصوص مترجمة
- RTL/LTR تلقائي عبر `document.documentElement.dir`
- الـ Hero text (Elite Selection) دايمًا عربي مش بيتغير

---

## ☁️ رفع الصور

Canvas compress (max 1200px, JPEG 0.8) → Cloudinary unsigned upload → تخزين `secure_url` في Firestore.

**مش محتاج env vars في Vercel** لأن الرفع مباشر من المتصفح.

---

## 🧪 تشغيل السيرفر محلياً

```bash
npm run dev -H 0.0.0.0 -p 3000        # HTTP (للديسكتوب)
npm run build                          # Build production
npm run start -H 0.0.0.0 -p 3000      # Run production
npm run lint                           # ESLint
npx tsc --noEmit                       # TypeScript check
firebase deploy --only firestore       # نشر قواعد Firestore
```

### iOS testing
iOS بيحظر HTTP على local network → استخدم Vercel deploy

---

## ✅ التعديلات — الإصدار v11.0 (30 مايو 2026)

| # | التغيير | الملف | التفاصيل |
|---|---------|-------|----------|
| 1 | اسكرول أفقي للكل | `app/page.tsx` | فلتر "الكل" بيظهر كل حاجة في horizontal scroll |
| 2 | Grid رأسي للفلاتر التانية | `app/page.tsx` | ورد/إيجار/مشاوير/باقات → grid 2 أعمدة |
| 3 | فلتر الكل يظهر كل حاجة | `app/page.tsx` | إزالة الكود اللي كان بيخفي أنواع معينة من "الكل" |
| 4 | الرئيسية → all | `app/page.tsx` | زر الرئيسية بيرجع لفلتر الكل |
| 5 | Touch Swipe | `app/page.tsx` | سوايب باللمس للصور في المودال |
| 6 | 🛎️ Notification Bell | `app/page.tsx` | جرس + badge + dropdown |
| 7 | تحسين أداء اللاج | `app/page.tsx` | rAF للـ scroll + useMemo + passive events |
| 8 | Firebase cache fix | `lib/firebase.ts` | try/catch حول persistentLocalCache لـ iOS |
| 9 | ErrorBoundary | `components/` | كلاس جديد يلف الـ app |
| 10 | SEO أولي | `app/layout.tsx` | meta tags + Google verification |
| 11 | Sitemap | `public/sitemap.xml` | XML sitemap |
| 12 | Elite Selection hide | `app/page.tsx` | بتختفي أول ما تسكرول |

## ✅ التعديلات — الإصدار v12.0 (31 مايو 2026)

| # | التغيير | الملف | التفاصيل |
|---|---------|-------|----------|
| 1 | إزالة Elite Selection من الموبايل | `app/page.tsx` | `hidden md:block` — الموبايل مش بيشوفه |
| 2 | أسهم السكرول الأفقي | `app/page.tsx` | ChevronLeft/ChevronRight + gradient |
| 3 | RTL-aware scroll | `app/page.tsx` | الأسهم تنقلب حسب اللغة |
| 4 | SEO شامل | `app/layout.tsx` | 60+ كلمة مفتاحية عربي + إنجليزي |
| 5 | JSON-LD Structured Data | `app/layout.tsx` | WebSite schema + SearchAction |
| 6 | Sitemap محدث | `public/sitemap.xml` | URLs جديدة + تاريخ محدث |
| 7 | metadataBase | `app/layout.tsx` | إضافة `metadataBase` |

## ✅ التعديلات — الإصدار v13.0 (1 يونيو 2026) — الجلسة الحالية

| # | التغيير | الملف | التفاصيل |
|---|---------|-------|----------|
| 1 | **🐛 Fix infinite loading skeleton** | `app/page.tsx` | إضافة `initialLoadDone` — لو Firebase فشل، ميفضلش skeleton للأبد، يظهر "لا توجد نتائج" |
| 2 | **🔥 Firebase Rules — رفع** | `firestore.rules` | نَشر rules على Firebase Console عشان `cars` collection تقبل read |
| 3 | **📊 Composite Index** | `firestore.indexes.json` | إنشاء index لـ `status ASC, createdAt DESC` + نشره |
| 4 | **🎯 فئات 2×2 في الموبايل** | `app/add-ad/page.tsx:245` | `grid-cols-4` → `grid-cols-2 md:grid-cols-4` |
| 5 | **📱 تصغير إعلانات my-ads** | `app/my-ads/page.tsx` | p-4/padding/border-radius/btn sizes/nh Smaller |
| 6 | **🔘 فلاتر في لوحة الأدمن** | `app/admin/page.tsx` | filter chips: الكل/عربيات/باقات/ورد/مشاوير |
| 7 | **🏷️ تحديث تسميات الفلاتر** | `lib/translations.ts` | زفه→عربيات زفاف, إيجار→عربيات إيجار, باكدج→باقات + English |
| 8 | **🔐 تفويض المستخدمين** | `firestore.rules` | create → أي مسجل, update → صاحب الإعلان أو الأدمن, delete → أدمن فقط |
| 9 | **🤖 robots.txt** | `public/robots.txt` | SEO — يسمح للكل، يمنع `/admin` |
| 10 | **🖼️ أيقونات PWA + Favicon** | `public/favicon.svg`, `icon-192.svg`, `icon-512.svg` | أيقونات SVG جديدة + تحديث manifest.json |
| 11 | **🐦 Twitter Cards** | `app/layout.tsx` | إضافة `twitter:card` + `twitter:image` للميتاداتا |
| 12 | **🎨 themeColor في Metadata API** | `app/layout.tsx` | إضافة `themeColor: '#0a0a0a'` |
| 13 | **🧹 تنظيف** | `public/` + `package.json` | حذف SVGs قديمة (globe/vercel/next/window/file) + إزالة framer-motion |

## ✅ التعديلات — الإصدار v14.0 (1 يونيو 2026) — الصيانة الشاملة

| # | التغيير | الملف | التفاصيل |
|---|---------|-------|----------|
| 1 | **🐛 Fix setState في useEffect** | `app/add-ad/page.tsx` | استخدام `useSearchParams` بدل `useEffect` مع `setEditId` — كان بيسبب re-render غير ضروري |
| 2 | **🐛 Fix `<a>` بدل `<Link>`** | `app/login/page.tsx` | استبدال `<a href="/">` بـ `<Link href="/">` |
| 3 | **🎨 تحسين تباين الألوان** | `app/admin/page.tsx` | تغيير `text-zinc-300` → `text-zinc-500` و `text-gray-300` → `text-gray-500` للـ empty state |
| 4 | **🎨 تحسين تباين الألوان** | `app/page.tsx` | رفع `text-white/10` → `text-white/30` لأيقونات البحث، و `text-zinc-600` → `text-zinc-400` لزر الإغلاق |
| 5 | **🖼️ إضافة alt للصور** | `app/admin/page.tsx`, `app/add-ad/page.tsx`, `app/my-ads/page.tsx` | إضافة `alt` لجميع وسوم `<img>` الناقصة |
| 6 | **🧹 تنظيف ESLint (35→0 errors)** | كل الملفات | إزالة `@ts-nocheck` من 4 ملفات + استبدال الـ `any` بأنواع صريحة أو eslint-disable |
| 7 | **🎯 سهم واحد للتمرير** | `app/page.tsx` | استبدال سهمين (يمين/يسار) بسهم واحد أصغر + RTL flip |
| 8 | **🎨 نص الموبايل الرئيسي** | `app/page.tsx` | استبدال `{t.mobileHero.title}` بنص عربي ثابت بخط لاكشري + fade on scroll |
| 9 | **📱 إعادة هيكلة الرئيسية** | `app/page.tsx` | تقسيم `activeFilter === 'all'` إلى أقسام: Packages → Wedding → Rental → Flowers → Trips — كل قسم بسكرول أفقي منفصل |
| 10 | **💐 كروت مبسّطة للورد والمشاوير** | `app/page.tsx` | الورد/المشاوير: بدون driver/بدون تقويم — فقط صورة + سعر + واتساب + تليفون |
| 11 | **📦 Suspense boundary** | `app/add-ad/page.tsx` | إضافة `<Suspense>` حول `AddAdContent` لدعم `useSearchParams` |

---

## 🎯 SEO — الكلمات المفتاحية المستهدفة

### عربي
```
زفه, زفة, فرح, افراح, فستاين, فساتين زفاف,
عربية فرح, سيارات زفاف, عربيات فرح,
بوكيه ورد عروسه, بوكيه ورد, تنسيق ورد, ورد طبيعى, ورد صناعى, زهور, باقة ورد, ورود, توصيل ورد, ورود فرح, بوكيه فرح,
ليموزين مصر, تاجير سيارات مصر, عربيه فاجره,
ميكب ارتست مصر, قاعات افراح, بدله عريس, كوشه افراح, كوشة, دعوة زفاف,
هدايا عرسان, ساعة فرح, اكسسوارات عرائس, خواتم فرح, كرفاته,
تصوير زفاف, مصور فرح,
زفه شبين الكوم, زفه منوفيه, زفه طنطا, زفه بنها, زفه دلتا, زفه القاهرة, زفه ملكه,
زفاف مصر, حجز عربية فرح
```

### English
```
cars wedding, wedding, zafah, zafa, zafah wedding, zaffa, zafa car,
wedding cars egypt, luxury car rental egypt, egypt wedding planner, bridal car,
wedding limousine, menoufia wedding, tanta wedding,
wedding flowers, flower bouquet, flower arrangement cairo
```

---

## ⚠️ المشاكل المعروفة (Known Issues)

| المشكلة | السبب | الحل المقترح |
|---------|-------|--------------|
| **ChatWidget.tsx مقفول** | `return null` في أول السطر | محتاج n8n webhook شغال |
| **Phone prefix 0→20** | `formatPhone()` في utils.ts | auto-prefix لمصر (متعمد) |
| **شاشة سودة على iOS HTTP** | iOS Safari بيحظر HTTP على local network | Vercel deploy / HTTPS |
| **Next.js images unoptimized** | كل صور Cloudinary عليها `unoptimized` | متعمد (عشان Cloudinary handles optimization) |
| **~~@ts-nocheck في 4 ملفات~~ — تم الحل** | page.tsx, admin, my-ads, add-ad | اتحذف `@ts-nocheck` واتستبدل بـ eslint-disable للـ `any` types + تصليح implicit anys |
| **self-signed cert مش موثوق** | iOS/Chrome بيحذر من certs غير موثوقة | deploy على Vercel أحسن |
| **PWA icons SVG مش PNG** | الأيقونات SVG مش PNG | شغالة على المتصفحات الحديثة، للتوافق الكامل حوّلها لـ PNG |

---

## 🧪 ملاحظات الاختبار

- **Dev server**: `npm run dev -H 0.0.0.0 -p 3000`
- **Build**: `npm run build` → 6/6 static pages (200 OK)
- **TypeScript**: `npx tsc --noEmit` → Zero errors
- **ESLint**: `npm run lint` → **0 errors**, 18 warnings (unused imports + `<img>` vs `<Image>` — كلها warnings)
- **Firebase**: rules + indexes بتننشر بـ `firebase deploy --only firestore`
- **iOS**: HTTP ممنوع → استخدم Vercel
- **المستخدمين**: لازم يكونوا مسجلين عشان ينشروا إعلانات

---

## 🤖 تعليمات للمطور التالي (AI/Agent)

عند قراءة هذا الملف، افهم التالي:

1. **النسخة الحالية v14.0** — آخر تعديل كان 1 يونيو 2026
2. **Firebase rules** محدثة — المستخدمين المسجلين ينشروا، صاحب الإعلان يعدل، الأدمن يمسح
3. **الـ Admin page** فيها فلاتر تصنيف (عربيات/باقات/ورد/مشاوير)
4. **PWA icons** موجودة كـ SVG — للتوافق الكامل مع iOS Safari، الأفضل تتحول لـ PNG
5. **الـ build يمر** (Turbopack) و TypeScript **صفر errors** + ESLint **صفر errors**
6. **لو ضفت collection جديد** في Firestore، حدث `firestore.rules` وانشره
7. **اتصال Firebase API key** عام (standard Firebase web SDK practice)
8. **ملفات مهمة للتعديل**: `app/page.tsx` (الرئيسية)، `app/layout.tsx` (SEO)، `lib/translations.ts` (الترجمة — 722 سطر)، `firestore.rules` (القواعد)
9. **Toast system**: `components/Toast.tsx` — `useToast()` hook متاح لكل الصفحات (استخدام: `const { toast } = useToast()`)
10. **Location Picker**: `components/LocationPicker.tsx` — `<LocationPicker value={location} onChange={setLocation} />` (محافظة → مدينة)
11. **تحذير مهم**: لو حصلت `Unexpected token }` أو `Expected ',' got 'ident'` في build، غالبًا مشكلة multiline string في JSX أو duplicate key في `translations.ts` — Turbopack حساس للـ newlines داخل strings
