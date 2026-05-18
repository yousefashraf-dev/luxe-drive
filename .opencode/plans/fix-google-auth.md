# Fix Google Sign-In / تسجيل الدخول

## 1️⃣ `lib/AuthContext.tsx` — `signInWithGoogle` + `getRedirectResult`

**السطر 63-93 الحالي:**
```tsx
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    await signInWithRedirect(auth, provider);
    return;
  }
  try {
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
    } else {
      throw err;
    }
  }
};
```

**يتم تغييره إلى:**
```tsx
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const isStandalone = typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  try {
    if (isIOS || isStandalone) {
      await signInWithRedirect(auth, provider);
      return;
    }
    await signInWithPopup(auth, provider);
  } catch (err: any) {
    console.error('Google sign-in error:', err.code || err, err.message || err);
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
    } else {
      throw err;
    }
  }
};
```

**السطر 82-93 الحالي (`getRedirectResult`):**
```tsx
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        if (result.user) setUser(result.user);
        router.push('/');
      }
    }).catch((err) => {
      if (err.code !== 'auth/no-redirect-data') {
        console.warn('getRedirectResult error:', err);
      }
    });
  }, [router]);
```

**يتم تغييره إلى:**
```tsx
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        if (result.user) setUser(result.user);
        router.push('/');
      }
    }).catch((err) => {
      if (err.code === 'auth/no-redirect-data') return;
      console.warn('getRedirectResult error:', err.code || err, err.message || err);
    });
  }, [router]);
```

## 2️⃣ `app/login/page.tsx` — إضافة auto-redirect لو مسجل

**بعد السطر 12 (بعد `const { signInWithGoogle } = useAuth();`) أضف:**
```tsx
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.push('/');
  }, [user, loading, router]);
```

**وبعدين غير السطر 12 الحالي من:**
```tsx
  const { signInWithGoogle } = useAuth();
```
**لـ:**
```tsx
  const { signInWithGoogle } = useAuth();
```
(خلّيه زي ما هو — الـ user و loading جواهم في `useAuth()` اللي فوق)

في الآخر هتكون:
```tsx
  const { signInWithGoogle, user, loading } = useAuth();
```

## ملحوظة مهمة

لو التسجيل فشل برضه بعد التعديلات، يبقى المشكلة في Firebase Console:
1. افتح https://console.firebase.google.com/
2. اختار مشروع `luxe-drive-db`
3. Authentication → Sign-in method → Google → فعّله
4. Authorized domains: أضف `zafah.vercel.app` و `localhost`
