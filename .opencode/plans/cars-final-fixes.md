# التعديلات النهائية — الخطة

## 1️⃣ فلتر all يخفي الورد
**الملف:** `app/page.tsx`

في دالة `displayCars`، بعد الشرط بتاع `activeFilter === 'rental'` ضيف:
```javascript
if (activeFilter === 'all' && (car.category === 'flowers' || car.bouquetName)) return false;
```

وكمان عدل نص زرار الفلتر عشان يبقى واضح:
- `all` → `🚗 عربيات` بدل `الكل`

## 2️⃣ إخفاء التقويم في فورم بوكيه الورد
**الملف:** `app/add-ad/page.tsx`

حول الـ CalendarPicker بخانة `<div>` في `step === 3`:
```jsx
{type !== 'flowers' && (
  <div>
    <label className="...">الأيام المحجوزة</label>
    <CalendarPicker bookedDays={bookedDays} onToggle={handleToggleDay} />
  </div>
)}
```

## 3️⃣ تبسيط الأرقام
**الملف:** `app/add-ad/page.tsx`
- شيل `phone2` من الـ state والـ form
- سيب `phone` و `whatsapp` بس

**الملف:** `app/my-ads/page.tsx`
- شيل `phone2` من مودال التعديل

**الملف:** `app/page.tsx` — المودال
- الـ CTA تظهر `phone` للاتصال، `whatsapp` للواتساب

## 4️⃣ إزالة الفلتر "الكل" من الفلتر بتاع السائق
لما يكون `activeFilter === 'all'`، متظهرش Driver filter (عشان كلها عربيات).

## 5️⃣ توثيق التعديلات في `last-save.md`

---

## بعد ما تنفذ
- `npm run build` عشان تتأكد
- `git add . && git commit -m "final fixes: flowers filter, calendar hide, phone cleanup"` 
- `git push origin your-branch` (البرانش بتاعك)
