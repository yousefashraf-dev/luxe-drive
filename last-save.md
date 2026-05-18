# آخر التعديلات — الماستر (18 مايو 2026)

## أوردر الرفع

```bash
git add .
git commit -m "major update: auth system, user ads, admin panel, filters, favorites"
git push origin main
```

---

## التعديلات اللي حصلت

### 1️⃣ نظام تسجيل الدخول (Google Auth)

- **ملف جديد**: `lib/AuthContext.tsx`
- Google Sign-In مع Firebase Auth
- أول مرة يسجل → auto-create document في `users` collection
- Admin check: `yousefgaafer85@gmail.com` بس
- Session persistence (لو سجل مرة وسكر الموقع، يفضل مسجل)
- iOS fallback: لو البوب أب اتنين → يتحول redirect تلقائيًا
- **تحديث**: `app/layout.tsx` — إضافة `<AuthProvider>`
- **تحديث**: `app/login/page.tsx` — إضافة Google Sign-In + ديزاين جديد

### 2️⃣ واجهة المستخدم (Navbar)

- **تحديث**: `app/page.tsx`
- زرار **Sign In** (جمب الـ Connect القديم)
- لما يسجل: أيقونة User دايرة صفرا + اسمه → Dropdown فيه:
  - ➕ إضافة إعلان
  - ❤️ إعلاناتي
  - ⭐ Admin Panel (للأدمن بس)
  - 🚪 تسجيل خروج
- **زرار الدعم الفني 🔵**: دايرة سودا — فتحها يظهر بوب أب فيه رقم واتساب واتصال
- **إزالة زرار USF** (الـ fixed)
- **إزالة "Luxury Service"** من الـ Navbar

### 3️⃣ إضافة الإعلان (النموذج المتطور)

- **ملف جديد**: `app/add-ad/page.tsx`
- **Stepped Form**:
  1. عربية ولا ورد؟
  2. لو عربية → زفه ولا إيجار؟
  3. بسائق ولا بدون؟
  4. التفاصيل: اسم، سعر، مدينة (Dropdown: المنوفية، القاهرة، الجيزة، طنطا، المنصورة، بنها، شبين الكوم، الإسكندرية)، رقم اتصال، واتساب (اختياري)، وصف، صور (Cloudinary)، تقويم تفاعلي
  5. لو ورد → اسم بوكيه، سعر، وصف، صور، رقم (مفيش تقويم)
- عند النشر → `status: suspended` (معلق — في انتظار موافقة الأدمن)
- التقويم التفاعلي: كبس على اليوم يتحجز (يتلون أحمر)، مع إمكانية التنقل بين الشهور، وعنوان الشهر واضح

### 4️⃣ صفحة إعلاناتي

- **ملف جديد**: `app/my-ads/page.tsx`
- Protected route (لازم مسجل دخول)
- يعرض اعلانات اليوزر بس (عن طريق `userId`)
- كل إعلان: اسم، صورة، سعر، حالة (منشور/معلق)، فيوات، باقي الأيام
- زرار تعديل → يفتح مودال فيه كل الحقول (نفس فورم الإضافة)
- لو الإعلان قرب يخلص (أقل من 3 أيام) → يظهر تحذير أحمر
- **إصلاح**: الـ query مكنش شغال بسبب الـ composite index — أصلحناه بـ client-side sort

### 5️⃣ لوحة الأدمن (مطورة)

- **تحديث**: `app/admin/page.tsx`
- تقييد الدخول: `yousefgaafer85@gmail.com` بس
- إزالة الفورم (الأدمن بيستخدم `/add-ad` زي أي يوزر)
- تقسيط الإعلانات: **قسم العربيات** و**قسم بوكيهات الورد** (كل واحد في section)
- كل إعلان باين: الحالة (منشور/معلق)، الفيوات، الأيام المحجوزة، صاحب الإعلان
- أزرار لكل إعلان:
  - **نشر/تعليق** (Toggle status: active ↔ suspended)
  - **VIP** (تمييز)
  - **تعديل** (بيروح لـ `/add-ad?edit=id`)
  - **حذف**
- لما ينشر → `expiryDate` = دلوقتي + 30 يوم

### 6️⃣ الفلاتر في الصفحة الرئيسية

- **تحديث**: `app/page.tsx`
- أزرار فلتر: 🚗 عربيات (الافتراضي) • 🎊 زفه • 🚙 إيجار • 💐 ورد • ❤️ مفضلة
- الـ **ورد** بيظهر بس في فلتر "💐 ورد" — مش في "🚗 عربيات"
- تحت فلتر زفه/إيجار → فلتر فرعي: بسائق/بدون
- البحث الذكي (150+ موديل) شغال عادي مع الفلاتر
- بتظهر بس الإعلانات الـ `status === 'active'`

### 7️⃣ نظام المفضلة

- قلب ❤️ على كل كارت عربية
- **للـ Client (مش مسجل)**: localStorage على الجهاز
- **للمستخدم المسجل**: Firebase (مرتبط بـ userId)
- فلتر "مفضلة" يعرض المحفوظات
- القلب يتلون أحمر لو العربية في المفضلة

### 8️⃣ واتساب برسالة جاهزة

- زرار الواتساب في المودال بيبعت رسالة جاهزة:
  > **مرحباً، أنا مهتم بـ [اسم العربية]**

### 9️⃣ تحسين التوافق مع iOS/الموبايل

- CSS fixes للـ iOS Safari (`-webkit-fill-available`, `-webkit-overflow-scrolling`)
- الـ modals تعمل scroll صح
- Google Sign-In fallback للـ popup blocker

### 🔟 تصميم وتحسينات

- نفس الديزاين الأسود/الدهبي الفخم
- الأرقام: **رقم اتصال + واتساب** (اتشيل رقم تاني)
- التقويم: نص أحمر "🔴 حدد الأيام اللي العربية فيها محجوزة" + عنوان الشهر واضح + أسهم مكتوب عليها "السابق" و"التالي"

---

## الملفات الجديدة

| الملف | الوظيفة |
|-------|---------|
| `lib/AuthContext.tsx` | Google Sign-In + Admin check + persistence |
| `app/add-ad/page.tsx` | نموذج إضافة إعلان متطور (Stepped Form) |
| `app/my-ads/page.tsx` | صفحة إعلاناتي (عرض + تعديل + تحليلات) |

## الملفات المحدثة

| الملف | التغييرات |
|-------|-----------|
| `app/layout.tsx` | إضافة `AuthProvider` |
| `app/page.tsx` | 600+ سطر — Auth UI + Filters + Favorites + Support + WhatsApp |
| `app/login/page.tsx` | Google Sign-In + ديزاين جديد |
| `app/admin/page.tsx` | Admin-only + status toggle + أقسام + حذف الفورم |
| `app/globals.css` | iOS fixes + scroll fixes |

## ملحوظة

ChatWidget لسه مقفول بـ `return null` — لو عاوز تشغله محتاج n8n على السيرفر.

---

# تحديث 18 مايو 2026 — الدفعة الثانية (v2.0)

## أوردر الرفع

```bash
git add .
git commit -m "v2.0: auth fixes, favorites Firebase, infinite scroll, phone formatting, UX improvements"
git push origin main
```

## التعديلات اللي حصلت

### 1️⃣ تسجيل الدخول — إصلاح شامل

| المشكلة | الملف | الحل |
|---------|-------|------|
| **Safari iOS Popup ممنوع** | `lib/AuthContext.tsx` | كشف iOS + Standalone (PWA) واستخدام `signInWithRedirect` مباشرة |
| **Popup بيفشل وفي خطأ تاني** | `lib/AuthContext.tsx` | تسجيل الـ error في الكونسول + تحسين معالجة الأخطاء |
| **`getRedirectResult` مش بينقل المستخدم** | `lib/AuthContext.tsx` | `router.push('/')` بعد نجاح الـ redirect + تحسين الـ catch |
| **بعد ما يسجل login — مش بينزل تحت** | `app/login/page.tsx` | `useEffect` auto-redirect لو المستخدم authenticated خلاص |
| **Admin page كانت بتعمل loop** | `app/admin/page.tsx` | تصحيح `authLoading` → `loading: authLoading` (كان متغير غلط) |
| **Sign In في الهوم بيشغل Google مباشرة** | `app/page.tsx` | تغيير لـ `<Link href="/login">` عشان المستخدم يقدر يستخدم إيميل/باسوورد |

### 2️⃣ المفضلة — Firebase للمسجلين

| المشكلة | الملف | الحل |
|---------|-------|------|
| **المفضلة مش شغالة للمسجلين** | `app/page.tsx` | إضافة كوليكشن `favorites` في Firestore — `{ userId, carId, createdAt }` |
| **ترحيل localStorage → Firebase** | `app/page.tsx` | عند تسجيل الدخول، دمج المفضلة المحلية مع Firebase وتفريغ localStorage |
| **Toggle favorites** | `app/page.tsx` | المسجل: addDoc/deleteDoc في Firebase. الضيف: localStorage |
| **Race condition** | `app/page.tsx` | استخدام `setFavorites(prev => ...)` مع localStorage جوه الـ callback |

### 3️⃣ Infinite Scroll + Pagination

| الميزة | الملف | التفاصيل |
|--------|-------|----------|
| 6 عربيات كل شحنة | `app/page.tsx` | `query(cars, orderBy("createdAt", "desc"), limit(6))` |
| تحميل تلقائي | `app/page.tsx` | `IntersectionObserver` — لما يوصل لآخر حاجة، يجيب 6 تانيين |
| Loader | `app/page.tsx` | Spinner + نص "Loading more..." تحت القائمة |
| إلغاء الكاش القديم | `app/page.tsx` | إزالة cache system (استبدل بـ pagination) |

### 4️⃣ رقم التليفون — تنسيق موحد

| الملف | التغيير |
|-------|---------|
| `lib/utils.ts` (**جديد**) | `formatPhone()` دالة: تظبط `+2010` / `010` / `2010` / `10` كلهم لـ `2010...` |
| `app/add-ad/page.tsx` | استخدام `formatPhone()` عند الإضافة |
| `app/my-ads/page.tsx` | استخدام `formatPhone()` عند التعديل |

### 5️⃣ Search Suggestions

| المشكلة | الحل |
|---------|------|
| الـ `useEffect` مش متابع `activeFilter`, `driverFilter`, `favorites` | إضافة كل الـ dependencies للـ useEffect عشان الـ suggestions تبقى up-to-date |

### 6️⃣ شكل المودال — تحسينات

| التغيير | السطر |
|---------|-------|
| اسم العربية: `font-semibold` (كان `font-light`) | `page.tsx:683` |
| إزالة الخط الـ تحت الاسم (الـ `<div>`) | `page.tsx` |
| الوصف: `font-medium` ولون أغمق | `page.tsx` |
| السعر في الكارد: `font-extrabold text-2xl` | `page.tsx` |
| أيام التقويم: `font-bold` + أوضح | `page.tsx` |

### 7️⃣ Chat API + SpeedInsights — إزالة

| الملف | الإجراء |
|-------|---------|
| `app/api/chat/route.ts` | حذف الملف بالكامل |
| `components/ChatWidget.tsx` | تعطيل (export default function مع return null) |
| `app/layout.tsx` | إزالة `import { SpeedInsights }` |

### 8️⃣ موارد جديدة

| الملف | الوظيفة |
|-------|---------|
| `public/placeholder-car.png` | صورة placeholder للعربيات اللي ملهاش صور |

### 9️⃣ ملفات جديدة

| الملف | الوظيفة |
|-------|---------|
| `lib/utils.ts` | دوال مساعدة (`formatPhone`) |

### 🔟 ملخص التغييرات (v2)

| الملف | نوع التغيير |
|-------|------------|
| `lib/AuthContext.tsx` | تحديث — Google Auth + Redirect + error handling |
| `lib/utils.ts` | **جديد** — دوال مساعدة |
| `app/page.tsx` | تحديث — Infinite Scroll + Favorites Firebase + Search + شكل |
| `app/login/page.tsx` | تحديث — Auto-redirect + error logging |
| `app/admin/page.tsx` | تحديث — Fix `loading` alias |
| `app/add-ad/page.tsx` | تحديث — `formatPhone()` |
| `app/my-ads/page.tsx` | تحديث — `formatPhone()` في التعديل |
| `app/layout.tsx` | تحديث — إزالة SpeedInsights |
| `components/ChatWidget.tsx` | تحديث — تعطيل كامل |
| `app/api/chat/route.ts` | **حذف** |
| `public/placeholder-car.png` | **جديد**

---

# تحديث 18 مايو 2026 — الدفعة الثالثة (v3.0): إصلاح Google Sign-In

## أوردر الرفع

```bash
git add .
git commit -m "v3.0: fix Google Sign-In — getRedirectResult + iOS redirect + select_account + error messages"
git push origin main
```

## التعديلات

| المشكلة | الملف | الحل |
|---------|-------|------|
| **iOS بعد الـ redirect بيفضل واقف (مش بيسجل)** | `lib/AuthContext.tsx` | إعادة `getRedirectResult` — لازم عشان iOS يكمل تسجيل الدخول بعد redirect بدون `setUser` متكرر (بيستخدم `window.location.href` بدل `router.push` عشان dependent) |
| **مفيش `select_account`** | `lib/AuthContext.tsx` | إضافة `provider.setCustomParameters({ prompt: 'select_account' })` عشان يجبر المستخدم يختار حساب جوجل دايمًا |
| **`router.push('/')` بيتنفذ بعد `signInWithRedirect`** | `app/login/page.tsx` | شيل `router.push('/')` من `handleGoogleSignIn` — الـ `useEffect` في اللوجين بيديركت لوحده |
| **رسالة خطأ عامة "فشل" ملهاش معنى** | `app/login/page.tsx` | إضافة رسايل خطأ بالعربي حسب `error.code` (مش مفعل، popup ممنوع، domain مش مضاف، إلخ) |
| **`zafah.vercel.app` مش مضاف في Authorized domains** | Firebase Console | إضافة `zafah.vercel.app` في Firebase > Authentication > Settings > Authorized domains |

## فحص التسليم

- [x] Google Sign-In على اللابتوب (Popup) — شغال ✅
- [x] Google Sign-In على iPhone (Redirect + getRedirectResult) — شغال ✅
- [x] رسايل خطأ بالعربي حسب الكود
- [x] `select_account` بيظهر اختيار الحساب دايمًا
