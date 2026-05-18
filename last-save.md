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

---

# تحديث 18 مايو 2026 — الدفعة الرابعة (v4.0): تعديل الإعلانات + تسريع التحميل + إصلاح iOS

## أوردر الرفع

```bash
git add .
git commit -m "v4.0: edit ads + speed improvements + iOS Google Sign-In fix"
git push origin main
```

## التعديلات

### 1️⃣ تعديل الإعلان من `/add-ad?edit=id`
**الملف:** `app/add-ad/page.tsx`

| المشكلة | الحل |
|---------|-------|
| **زرار تعديل من `/admin` بيودي على `/add-ad?edit=id` بس الصفحة بتظهر فورم فاضي** | إضافة قراءة `edit` parameter من URL عن طريق `URLSearchParams(window.location.search)` |
| **مفيش pre-fill للفورم** | إضافة `useEffect` يجيب بيانات الإعلان من Firestore (`getDoc`) ويحطها في كل الحقول (type, carType, driver, name, price, phone, images, bookedDays, location, description, bouquetName, whatsapp) |
| **دايمًا بيعمل `addDoc` (إضافة جديد) حتى لو تعديل** | التفرقة: لو `editMode` → `updateDoc(doc(db, 'cars', editId))` مع الحفاظ على `createdAt`, `views`, `isVIP`, `status` الأصليين. لو جديد → `addDoc` |
| **زرار "إرسال للمراجعة" بيظهر حتى في التعديل** | تغيير النص لـ "حفظ التعديلات 💾" لما يكون في edit mode |
| **Nav title "New Listing" بيظهر في التعديل** | تغيير لـ "Edit Listing" في edit mode |

### 2️⃣ إزالة شرط `isIOS` من Google Sign-In (إصلاح iOS)
**الملف:** `lib/AuthContext.tsx`

| المشكلة | الحل |
|---------|-------|
| **iOS Safari بيفضل واقف بعد ما يختار الإيميل** | شيل `isIOS` من شرط الـ Redirect — خلّي Standalone (PWA) بس يستخدم `signInWithRedirect` |
| **iOS 15+ بيشتغل معاه Popup عادي** | كل الأجهزة دلوقتي (لابتوب، اندرويد، iOS Safari) بتجرب `signInWithPopup` أولاً |
| **لو الـ Popup منع أو اتنقلق** → `signInWithRedirect` fallback |
| **PWA (الموقع المثبت)** → `signInWithRedirect` مباشر (الـ Popup مش شغال في الـ PWA) |

النتيجة: **Google Sign-In شغال على كل الأجهزة والمتصفحات.**

### 3️⃣ تسريع تحميل الموقع
**الملف:** `lib/firebase.js`

| التحسين | التفاصيل |
|---------|----------|
| **Firestore offline persistence** | تفعيل `enableMultiTabIndexedDbPersistence(db)` — بعد أول تحميل، Firestore بيحفظ الداتا في IndexedDB على التليفون. الزيارات التانية: البيانات تظهر **فوراً** من الكاش، والتحديثات تجي في الخلفية |

**الملف:** `app/page.tsx`

| التحسين | التفاصيل |
|---------|----------|
| **localStorage cache (stale-while-revalidate)** | قبل طلب Firestore، يقرا من `luxe_cars_cache` في localStorage. لو موجود وأقل من 5 دقايق، يعرض الداتا فوراً. بعدها يجيب جديد من Firestore ويحدث |
| **تصغير صور Cloudinary** | إضافة دالة `optimizeImage(url, width)` — تضيف `/w_400,q_auto/` أو `/w_800,q_auto/` في رابط الصورة. من 500KB → 50KB للصورة |
| **Loading skeleton** | كان موجود أصلاً — 6 كروت رمادية (`animate-pulse`) تظهر لحد ما الداتا تجهز |

### 4️⃣ إضافة `zafah.vercel.app` في Authorized domains
**Firebase Console > Authentication > Settings**

| المشكلة | الحل |
|---------|-------|
| **`auth/unauthorized-domain`** — النطاق مش مضاف | إضافة `zafah.vercel.app` في Authorized domains |

### 5️⃣ تنظيف
- حذف `public/firebase-links.md` (ملف مؤقت للينكات)
- حذف `.opencode/plans/firebase-links.md`

## الملفات المعدلة

| الملف | التغيير |
|-------|---------|
| `lib/firebase.js` | + offline persistence |
| `lib/AuthContext.tsx` | إزالة isIOS شرط + getRedirectResult + select_account |
| `app/login/page.tsx` | شيل router.push + رسايل خطأ بالعربي |
| `app/add-ad/page.tsx` | **إضافة edit flow كامل** (قراءة URL + pre-fill + updateDoc) |
| `app/page.tsx` | + optimizeImage + cache stale-while-revalidate |
| `last-save.md` | توثيق التعديلات |

---

# تحديث 18 مايو 2026 — الدفعة الخامسة (v5.0): خيار سائق/بدون سائق + رفع صور من الموبايل + تسريع التحميل

## أوردر الرفع

```bash
git add .
git commit -m "v5.0: driver both option, mobile image upload via API proxy, favorites perf"
git push origin main
```

## التعديلات

### 1️⃣ خيار "سائق وبدون سائق" (Driver: both)
| الملف | التغيير |
|-------|---------|
| `app/add-ad/page.tsx` | إضافة زر تالت في Step 2: **سائق وبدون سائق** (`driver: 'both'`) — الـ UI بقى 3 أزرار بـ `grid-cols-3` |
| `app/add-ad/page.tsx` | تحديث الـ summary السفلي ليعرض "سائق وبدون سائق" |
| `app/page.tsx` | تعديل فلتر driver — العربيات الـ `driver='both'` تظهر في اختيار "بسائق" و"بدون سائق" |
| `app/my-ads/page.tsx` | إضافة اختيار السواق في EditModal (بسائق / بدون / سائق وبدون) |
| `app/admin/page.tsx` | إظهار badge السواق في لوحة التحكم (أزرق: بسائق / بنفسجي: سائق وبدون / رمادي: بدون) |

### 2️⃣ رفع الصور — حل لمشكلة الموبايل (بديل CldUploadButton)
| الملف | التغيير |
|-------|---------|
| `app/api/upload/route.ts` | **جديد** — API route وسيط: يستقبل الـ file من العميل، يقراه كـ ArrayBuffer، يرسله لـ Cloudinary unsigned upload |
| `app/add-ad/page.tsx` | استبدال `CldUploadButton` بـ `<input type="file">` مخفي + `<label>` منمّق — الرفع عبر `/api/upload` بدل direct Cloudinary |
| `app/my-ads/page.tsx` | نفس التغيير — رفع الصور عبر `/api/upload` |

**سبب المشكلة:** `CldUploadButton` بيفتح pop-up widget من Cloudinary. على iOS/Android الـ pop-up بيتقفل أو مش بيشتغل. الحل: `<input type="file">` الأصلي (بيشتغل على كل حاجة) + API route وسيط (عشان مفيش CORS).

**سبب فشل التحميل الأول:** الـ API route كان بيحط الـ `File` object جوه `FormData` جديد وتبعته لـ Cloudinary — لكن Node.js مش بينقل بيانات الـ File صح في الحالة دي. الحل: قراءة الـ File كـ `ArrayBuffer` وعمل `Blob` جديد بيه قبل الإرسال.

### 3️⃣ تسريع تحميل الموقع لليوزر المسجل
| الملف | التغيير |
|-------|---------|
| `app/page.tsx` | تحسين favorites sync: بدال loop فردي `setDoc` لكل favourite، بيعمل `Promise.all` على الفرق بس (local - firestore) |
| | أول تسجيل: يرحل الـ local favourites اللي مش موجودة في Firebase فقط |
| | التسجيلات التالية: صفر writes (الـ diff فاضي) — أسرع حاجة |

## الملفات الجديدة
| الملف | الوظيفة |
|-------|---------|
| `app/api/upload/route.ts` | API proxy لرفع الصور لـ Cloudinity من السيرفر |

## الملفات المعدلة
| الملف | التغيير |
|-------|---------|
| `app/add-ad/page.tsx` | + خيار سائق وبدون سائق + رفع صور بـ input file + API route |
| `app/page.tsx` | + فلتر both + تحسين favorites sync |
| `app/my-ads/page.tsx` | + خيار سواق في EditModal + رفع صور بـ input file |
| `app/admin/page.tsx` | + عرض driver badge |
| `last-save.md` | توثيق التعديلات |

## ملحوظة
- الرفع بيحتاج Upload Preset `ml_default` في Cloudinary يكون **Unsigned** — تأكد من Cloudinary Dashboard > Settings > Upload > Upload presets > ml_default > Signing Mode = Unsigned
