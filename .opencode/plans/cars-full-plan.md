# خطة تطوير موقع ZaFah — التنفيذ الكامل

## المرحلة 1: AuthContext + Google Sign-In

### 1.1 إنشاء `lib/AuthContext.tsx`

```tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_EMAILS = ['yousefgaafer85@gmail.com'];

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'user';
  createdAt: any;
}

interface AuthContextType {
  user: any;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, userProfile: null, loading: true, isAdmin: false,
  signInWithGoogle: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
            const newProfile: UserProfile = {
              uid: firebaseUser.uid, email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User', photoURL: '',
              role: isAdmin ? 'admin' : 'user', createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) { console.error(err); setUserProfile(null); }
      } else { setUserProfile(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const isAdmin = userProfile?.role === 'admin' || ADMIN_EMAILS.includes(user?.email || '');

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 1.2 تحديث `app/layout.tsx`

أضف `import { AuthProvider } from '@/lib/AuthContext';` ولف الـ children بـ `<AuthProvider>...</AuthProvider>`.

### 1.3 تحديث `app/login/page.tsx`

أضف Google Sign-In زرار فوق زر login العادي.

## المرحلة 2: تحديث الـ Navbar في app/page.tsx

أضف في الـ Navbar (جمب "Connect"):
- لو مش مسجل: `<button onClick={signInWithGoogle}>Sign In</button>`
- لو مسجل: أيقونة User + اسم + Dropdown (إعلاناتي, تسجيل خروج)
- لو Admin: لينك سريع للأدمن

## المرحلة 3: تحديث بيانات Firestore

### `cars` collection — حقول جديدة:
- `category`: 'car_wedding' | 'car_rental' | 'flowers'
- `driver`: 'with' | 'without' | null
- `location`: string (مدينة)
- `phone2`: string (رقم تاني اختياري)
- `whatsapp`: string (رقم واتساب)
- `bouquetName`: string (للورد)
- `userId`: string
- `userEmail`: string
- `status`: 'suspended' | 'active'
- `expiryDate`: timestamp

## المرحلة 4: نموذج إضافة الإعلان

صفحة `/add-ad` مع stepped form:
1. عربية ولا ورد؟
2. لو عربية ← إيجار ولا زفه؟ ← بسائق ولا بدون؟
3. اسم، سعر، مدينة (Dropdown)، رقم، واتساب (اختياري)، وصف
4. تقويم تفاعلي (كبس على اليوم)
5. صور (Cloudinary)
6. عند النشر → `status: suspended`

## المرحلة 5: صفحة إعلاناتي (`/my-ads`)

- Protected route (لازم مسجل)
- يعرض اعلانات اليوزر فقط
- كل اعلان: فيوات، حالة، تاريخ انتهاء
- زرار تعديل (يفتح الفورم)

## المرحلة 6: لوحة الأدمن المطورة

- تحقق من الإيميل `yousefgaafer85@gmail.com`
- قسم العربيات وقسم الورد منفصلين
- لكل اعلان: نشر/تعليق، تعديل، حذف، VIP، views, status
- شريط إحصائيات

## المرحلة 7: نظام الـ 30 يوم

- عند النشر: `expiryDate = now + 30 يوم`
- اليوم 28: رسالة
- اليوم 30: `status = suspended`
- الـ suspended مختفي من الرئيسية

## المرحلة 8: الفلاتر في الصفحة الرئيسية

- زفه / إيجار / ورد / مفضلة
- بسائق / بدون
- البحث الذكي شغال

## المرحلة 9: المفضلة

- قلب على كل كارت
- Client: localStorage
- User: Firebase
- فلتر المفضلة

---

## كيفية التنفيذ

بعد ما تقرأ الخطة وتوافق، قل "خلاص مشي الخطة" وهبدأ اشتغل على كل ملف بالترتيب.
