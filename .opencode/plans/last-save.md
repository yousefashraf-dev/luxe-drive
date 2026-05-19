# Last Save — ملخص كل التعديلات

> 2026-05-19

---

## 1. رفع الصور — الحل النهائي

### المشكلة
الصور كانت بتتخزن كـ base64 في Firestore (500KB+ لكل صورة)، والـ canvas كان بيفشل على موبايلات كتير.

### الحل
**رفع مباشر من المتصفح لـ Cloudinary** بـ unsigned preset بعد ضغط الصورة بالـ canvas.

### ملف `lib/useUpload.ts`
- Canvas resize لـ 1200px + JPEG 0.8
- رفع الـ blob المضغوط لـ `https://api.cloudinary.com/v1_1/dliaxor9r/image/upload`
- Upload preset: `zafah_unsigned`
- Fallback: لو الـ canvas فشل، يرفع الملف الأصلي

### الملفات المتأثرة
| الملف | التغيير |
|-------|---------|
| `lib/useUpload.ts` | canvas compress → Cloudinary API مباشر |
| `lib/firebase.js` | `persistentLocalCache` بدل `enableMultiTabIndexedDbPersistence` |
| `app/page.tsx` | `f_auto` في optimizeImage + `where(status, active)` + cache 24h |
| `app/api/upload/route.ts` | **اتحذف** (مش محتاجينه) |

### إعدادات خارجية
- Cloudinary Upload Preset: `zafah_unsigned` (unsigned)
- Cloud name: `dliaxor9r`
- Firestore Composite Index: `cars` collection على `status ↑, createdAt ↓`

---

## 2. تحسين سرعة الموقع

| قبل | بعد |
|-----|-----|
| `enableMultiTabIndexedDbPersistence` (قديم) | `persistentLocalCache` (جديد — أسرع) |
| Firestore بجيب كل الإعلانات (حتى المعلقة) | فلتر `where("status", "==", "active")` — المنشور بس |
| Cache 5 دقايق | Cache 24 ساعة |
| `optimizeImage` مش بتشتغل (base64) | `f_auto,w_${width},q_auto` — WebP/AVIF تلقائي |

---

## 3. الفافوريت (القلب)

### المشكلة
عداد الفافوريت كان بيحسب كل الـ IDs حتى لو الإعلان اتمسح.

### الحل
- العداد: `cars.filter(c => favorites.includes(c.id)).length` — يحسب بس الموجود فعلياً
- طريقة الحفظ:
  - **مسجل بايميل**: Firestore collection `favorites`
  - **مش مسجل**: localStorage
- الفلتر `status === 'active'` يضمن إن الإعلانات المحذوفة أو المعلقة مش بتظهر

---

## 4. Auto-Expiry + تجديد الإعلانات

### `app/my-ads/page.tsx`
- **Auto-suspend**: لو `expiryDate` فاتت والـ status لسه `active` → updateDoc(`status: suspended`)
- **زر "🔄 جدد الإعلان"**: يظهر للإعلانات المعلقة أو المنتهية، يفتح WhatsApp:
  ```
  https://wa.me/201095976766?text=عاوز أجدد إعلان NAME
  ```

### `app/admin/page.tsx`
- عرض الأيام المتبقية لكل إعلان نشط
- ألوان:
  - 🟢 `> 7 أيام`
  - 🟡 `< 7 أيام`
  - 🔴 منتهي

---

## 5. سير العمل الكامل

```
صاحب إعلان → يرفع (status: suspended)
                  ↓
ADMIN يستلم الفلوس → ينشّط + expiryDate = 30 يوم
                  ↓
الإعلان يظهر أمام الجميع لمدة 30 يوم
                  ↓
my-ads يعرض countdown ⏰ متبقي X يوم
                  ↓
لما expiryDate تفوت → auto-suspend
                  ↓
صاحب الإعلان يشوف "🔄 جدد الإعلان" → واتساب ADMIN
                  ↓
ADMIN يستلم الفلوس → ينشّط تاني (30 يوم جديدة)
                  🔄
```

---

## 6. Env Variables

`.env.local`:
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="dliaxor9r"
NEXT_PUBLIC_CLOUDINARY_API_KEY="521258644996998"
NEXT_PUBLIC_CLOUDINARY_API_SECRET="ZJy3bsBDZ7D4UiM2Ig1eoLc0_qs"
```

**ملاحظة**: مش محتاج تحطهم في Vercel Dashboard لأن الرفع مباشر من المتصفح لـ Cloudinary (unsigned preset).

---

## 7. ملاحظات مهمة

- **Firestore Composite Index** اتضاف: `cars` collection — `status` ASC, `createdAt` DESC
- **Cloudinary Upload Preset**: `zafah_unsigned` (unsigned)
- **WhatsApp Admin**: `+201095976766`
- الإعلانات القديمة اللي فيها base64 images — اتمسحت ونشرت جديد باستخدام Cloudinary

---

## الملفات المتغيرة

| ملف | الحالة |
|-----|--------|
| `lib/useUpload.ts` | 🔄 إعادة كتابة (canvas + Cloudinary API) |
| `lib/firebase.js` | 🔄 تحديث persistence API |
| `app/page.tsx` | 🔄 optimizeImage + فلتر status + cache + فافوريت |
| `app/admin/page.tsx` | 🔄 إضافة أيام متبقية + ألوان |
| `app/my-ads/page.tsx` | 🔄 auto-suspend + زر تجديد |
| `app/api/upload/route.ts` | ❌ حذف |
