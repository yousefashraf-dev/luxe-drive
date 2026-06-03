/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import Image from 'next/image';
import { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { Phone, X, ChevronRight, ChevronLeft, MessageCircle, Star, Search, ZoomIn, Download, Share2, Check, User, LogOut, Plus, Heart, Bell } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, increment, query, where, setDoc, deleteDoc, serverTimestamp, orderBy, limit, startAfter } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';

/* ─── Optimize Cloudinary image URL ─── */
function optimizeImage(url: string, width: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,w_${width},q_auto/`);
}

/* ─── Format price ─── */
function formatPrice(price: string | number): string {
  return Number(price).toLocaleString('ar-EG');
}

/* ─── detect iOS / Android ─── */
function getOS(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/* ─── Share helper ─── */
async function shareCar(car: any) {
  const url   = `${window.location.origin}?car=${car.id}`;
  const title = `${car.name} — JOY DRIVE`;
  const text  = `${car.name} — JOY DRIVE`;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(url);
  }
}

/* ─── PWA Install Banner ─── */
function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useLanguage();
  const os = getOS();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; }
    onDismiss();
  };

  if (os === 'ios') return (
    <div className="fixed bottom-5 left-4 right-4 z-[400] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 shadow-2xl">
        <button onClick={onDismiss} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center group">
          <X size={13} className="text-white/60 group-hover:text-white transition-colors" />
        </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#c5a059]/20 flex items-center justify-center">
              <Share2 size={18} className="text-[#c5a059]" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">{t.installBanner.iosTitle}</p>
              <p className="text-white/40 text-[10px] tracking-wider uppercase">{t.installBanner.iosSub}</p>
            </div>
          </div>
          <div className="space-y-2.5 text-right" dir="rtl">
            {t.installBanner.steps.map(([n, pre, gold, post]: string[]) => (
            <div key={n} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
              <span className="text-white/40 text-[11px] font-bold">{n}</span>
              <p className="text-white/70 text-[12px]">{pre} <span className="text-[#c5a059] font-bold">{gold}</span> {post}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (os === 'android') return (
    <div className="fixed bottom-5 left-4 right-4 z-[400] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 shadow-2xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#c5a059]/20 flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-[#c5a059]" />
        </div>
        <div className="flex-1 text-right" dir="rtl">
          <p className="text-white text-sm font-bold">{t.installBanner.androidTitle}</p>
          <p className="text-white/50 text-[11px]">{t.installBanner.androidSub}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleAndroidInstall} className="bg-[#c5a059] text-black text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-2xl active:scale-95 transition-all">{t.installBanner.install}</button>
          <button onClick={onDismiss} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X size={13} className="text-white/60" />
          </button>
        </div>
      </div>
    </div>
  );

  return null;
}

/* ── Smart search: model → brand · عربي · English ── */
const modelInfo: Record<string, { brand: string; en: string }> = {
  // BMW
  'm3': { brand: 'bmw', en: 'm3' }, 'm4': { brand: 'bmw', en: 'm4' },
  'm5': { brand: 'bmw', en: 'm5' }, 'x3': { brand: 'bmw', en: 'x3' },
  'x5': { brand: 'bmw', en: 'x5' }, 'x6': { brand: 'bmw', en: 'x6' },
  '320': { brand: 'bmw', en: '320' }, '520': { brand: 'bmw', en: '520' },
  // Hyundai
  'النترا': { brand: 'hyundai', en: 'elantra' }, 'elantra': { brand: 'hyundai', en: 'elantra' },
  'cn7': { brand: 'hyundai', en: 'cn7' }, 'سي ان سفن': { brand: 'hyundai', en: 'cn7' },
  'فيرنا': { brand: 'hyundai', en: 'verna' }, 'verna': { brand: 'hyundai', en: 'verna' },
  'accent': { brand: 'hyundai', en: 'accent' },
  'توسان': { brand: 'hyundai', en: 'tucson' }, 'tucson': { brand: 'hyundai', en: 'tucson' },
  'سنتافي': { brand: 'hyundai', en: 'santafe' }, 'santafe': { brand: 'hyundai', en: 'santafe' },
  'ازيرا': { brand: 'hyundai', en: 'azera' }, 'azera': { brand: 'hyundai', en: 'azera' },
  'سوناتا': { brand: 'hyundai', en: 'sonata' }, 'sonata': { brand: 'hyundai', en: 'sonata' },
  // Nissan
  'صني': { brand: 'nissan', en: 'sunny' }, 'sunny': { brand: 'nissan', en: 'sunny' },
  'سينترا': { brand: 'nissan', en: 'sentra' }, 'sentra': { brand: 'nissan', en: 'sentra' },
  'قشقاي': { brand: 'nissan', en: 'qashqai' }, 'qashqai': { brand: 'nissan', en: 'qashqai' },
  'maxima': { brand: 'nissan', en: 'maxima' },
  'باترول': { brand: 'nissan', en: 'patrol' }, 'patrol': { brand: 'nissan', en: 'patrol' },
  // Toyota
  'كورولا': { brand: 'toyota', en: 'corolla' }, 'corolla': { brand: 'toyota', en: 'corolla' },
  'كامري': { brand: 'toyota', en: 'camry' }, 'camry': { brand: 'toyota', en: 'camry' },
  'يارس': { brand: 'toyota', en: 'yaris' }, 'yaris': { brand: 'toyota', en: 'yaris' },
  'هايلكس': { brand: 'toyota', en: 'hilux' }, 'hilux': { brand: 'toyota', en: 'hilux' },
  'لاندكروزر': { brand: 'toyota', en: 'land cruiser' }, 'land cruiser': { brand: 'toyota', en: 'land cruiser' },
  'راف فور': { brand: 'toyota', en: 'rav4' }, 'rav4': { brand: 'toyota', en: 'rav4' },
  'fortuner': { brand: 'toyota', en: 'fortuner' },
  // Mercedes
  'maybach': { brand: 'mercedes', en: 'maybach' }, 'مايبخ': { brand: 'mercedes', en: 'maybach' },
  'e class': { brand: 'mercedes', en: 'e class' }, 'e250': { brand: 'mercedes', en: 'e250' },
  'اي كلاس': { brand: 'mercedes', en: 'e class' },
  'c class': { brand: 'mercedes', en: 'c class' }, 'c200': { brand: 'mercedes', en: 'c200' }, 'c180': { brand: 'mercedes', en: 'c180' },
  'سي كلاس': { brand: 'mercedes', en: 'c class' },
  's class': { brand: 'mercedes', en: 's class' }, 's500': { brand: 'mercedes', en: 's500' },
  'اس كلاس': { brand: 'mercedes', en: 's class' },
  'g class': { brand: 'mercedes', en: 'g class' }, 'g63': { brand: 'mercedes', en: 'g63' },
  'جي كلاس': { brand: 'mercedes', en: 'g class' },
  'gle': { brand: 'mercedes', en: 'gle' }, 'glc': { brand: 'mercedes', en: 'glc' },
  // Range Rover
  'range rover': { brand: 'range rover', en: 'range rover' }, 'رانج روفر': { brand: 'range rover', en: 'range rover' },
  'sport': { brand: 'range rover', en: 'sport' }, 'سبورت': { brand: 'range rover', en: 'sport' },
  'velar': { brand: 'range rover', en: 'velar' }, 'فيلار': { brand: 'range rover', en: 'velar' },
  'vogue': { brand: 'range rover', en: 'vogue' }, 'فوغ': { brand: 'range rover', en: 'vogue' },
  'evoque': { brand: 'range rover', en: 'evoque' },
  // Peugeot
  'peugeot': { brand: 'peugeot', en: 'peugeot' }, 'بيجو': { brand: 'peugeot', en: 'peugeot' },
  '301': { brand: 'peugeot', en: '301' }, '208': { brand: 'peugeot', en: '208' },
  '308': { brand: 'peugeot', en: '308' }, '405': { brand: 'peugeot', en: '405' },
  '508': { brand: 'peugeot', en: '508' }, '2008': { brand: 'peugeot', en: '2008' },
  '3008': { brand: 'peugeot', en: '3008' },
  // Mitsubishi
  'lancer': { brand: 'mitsubishi', en: 'lancer' }, 'لانسر': { brand: 'mitsubishi', en: 'lancer' },
  'lancer shark': { brand: 'mitsubishi', en: 'lancer shark' }, 'لانسر شارك': { brand: 'mitsubishi', en: 'lancer shark' },
  'pajero': { brand: 'mitsubishi', en: 'pajero' }, 'باجيرو': { brand: 'mitsubishi', en: 'pajero' },
  'eclipse cross': { brand: 'mitsubishi', en: 'eclipse cross' },
  // Kia
  'cerato': { brand: 'kia', en: 'cerato' }, 'سيراتو': { brand: 'kia', en: 'cerato' },
  'sportage': { brand: 'kia', en: 'sportage' }, 'سبورتاج': { brand: 'kia', en: 'sportage' },
  'picanto': { brand: 'kia', en: 'picanto' }, 'بيكانتو': { brand: 'kia', en: 'picanto' },
  'pegas': { brand: 'kia', en: 'pegas' }, 'بيجاس': { brand: 'kia', en: 'pegas' },
  'k5': { brand: 'kia', en: 'k5' }, 'soul': { brand: 'kia', en: 'soul' },
  // Honda
  'civic': { brand: 'honda', en: 'civic' }, 'سيفيك': { brand: 'honda', en: 'civic' },
  'accord': { brand: 'honda', en: 'accord' }, 'اكورد': { brand: 'honda', en: 'accord' },
  'city': { brand: 'honda', en: 'city' }, 'crv': { brand: 'honda', en: 'crv' }, 'cr-v': { brand: 'honda', en: 'cr-v' },
  // Chevrolet
  'cruze': { brand: 'chevrolet', en: 'cruze' }, 'كروز': { brand: 'chevrolet', en: 'cruze' },
  'malibu': { brand: 'chevrolet', en: 'malibu' }, 'ماليبو': { brand: 'chevrolet', en: 'malibu' },
  'spark': { brand: 'chevrolet', en: 'spark' }, 'سبارك': { brand: 'chevrolet', en: 'spark' },
  'captiva': { brand: 'chevrolet', en: 'captiva' }, 'optra': { brand: 'chevrolet', en: 'optra' },
  // Renault
  'duster': { brand: 'renault', en: 'duster' }, 'داستر': { brand: 'renault', en: 'duster' },
  'logan': { brand: 'renault', en: 'logan' }, 'لوجان': { brand: 'renault', en: 'logan' },
  'megane': { brand: 'renault', en: 'megane' }, 'ميجان': { brand: 'renault', en: 'megane' },
  // Porsche
  'cayenne': { brand: 'porsche', en: 'cayenne' }, 'كايين': { brand: 'porsche', en: 'cayenne' },
  // Ferrari / Lamborghini
  'ferrari': { brand: 'ferrari', en: 'ferrari' }, 'فيراري': { brand: 'ferrari', en: 'ferrari' },
  'lamborghini': { brand: 'lamborghini', en: 'lamborghini' }, 'لامبورجيني': { brand: 'lamborghini', en: 'lamborghini' },
};

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function Home() {
  const [cars, setCars]                 = useState<any[]>([]);
  const [hasMore, setHasMore]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedCar, setSelectedCar]   = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY]           = useState(0);
  const [mounted, setMounted]           = useState(false);
  const [zoomedImage, setZoomedImage]   = useState<string | null>(null);
  const [isClosing, setIsClosing]       = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const [activeFilter, setActiveFilter] = useState<'all' | 'wedding' | 'rental' | 'flowers' | 'trip' | 'favorites' | 'package'>('all');
  const [driverFilter, setDriverFilter] = useState<'all' | 'with' | 'without'>('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('joydrive_favorites');
        return stored ? JSON.parse(stored) : [];
      } catch {}
    }
    return [];
  });
  const [mobileTab, setMobileTab] = useState<'home' | 'favorites' | 'more'>('home');
  const [notifications, setNotifications] = useState<{ carId: string; carName: string; daysLeft: number; expiryDate: Date }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const { user, userProfile, loading: authLoading, isAdmin, signOut } = useAuth();
  const { t, lang, dir, toggleLang } = useLanguage();

  /* ── Favorites management ── */
  useEffect(() => {
    if (!user) return;
    const migrateAndFetch = async () => {
      try {
        const localRaw = localStorage.getItem('joydrive_favorites');
        const localFavs = localRaw ? JSON.parse(localRaw) : [];
        const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const firestoreFavs = snap.docs.map(d => d.data().carId);
        const merged = [...new Set([...localFavs, ...firestoreFavs])];
        startTransition(() => setFavorites(merged));
        const diff = localFavs.filter((id: string) => !firestoreFavs.includes(id));
        if (diff.length > 0) {
          await Promise.all(diff.map((carId: string) =>
            setDoc(doc(db, 'favorites', `${user.uid}_${carId}`), {
              userId: user.uid, carId, createdAt: serverTimestamp(),
            })
          ));
        }
        localStorage.removeItem('joydrive_favorites');
      } catch (err) { console.error('Favorites sync error:', err); }
    };
    migrateAndFetch();
  }, [user]);

  const toggleFavorite = async (carId: string) => {
    const isFav = favorites.includes(carId);
    setFavorites(prev => {
      const updated = isFav ? prev.filter(id => id !== carId) : prev.includes(carId) ? prev : [...prev, carId];
      if (!user) {
        try { localStorage.setItem('joydrive_favorites', JSON.stringify(updated)); } catch {}
      }
      return updated;
    });
    if (user) {
      try {
        if (isFav) {
          await deleteDoc(doc(db, 'favorites', `${user.uid}_${carId}`));
        } else {
          await setDoc(doc(db, 'favorites', `${user.uid}_${carId}`), {
            userId: user.uid, carId, createdAt: serverTimestamp(),
          });
        }
      } catch (err) { console.error('Favorite toggle error:', err); }
    }
  };

  const searchRef = useRef<HTMLDivElement>(null);
  const fleetRef  = useRef<HTMLDivElement>(null);
  const myWhatsAppNumber = "201095976766";

  const displayCars = useMemo(() => (cars || []).filter((car) => {
    // Only show active (published) ads
    if (car.status && car.status !== 'active') return false;

    // Filter by favorites
    if (activeFilter === 'favorites') {
      return favorites.includes(car.id);
    }

    // Filter by category
    if (activeFilter === 'flowers') {
      if (car.category !== 'flowers' && car.category !== 'car_wedding' && !car.bouquetName) return false;
    }
    if (activeFilter === 'trip' && car.category !== 'trip') return false;
    if (activeFilter === 'wedding') {
      if (car.category !== 'car_wedding' && car.category !== 'flowers') return false;
    }
    if (activeFilter === 'rental' && car.category !== 'car_rental') return false;
    if (activeFilter === 'package' && car.category !== 'car_package') return false;
    // 'all' shows everything — no exclusion

    // Filter by driver (only for cars), 'both' matches either filter
    if (activeFilter !== 'flowers' && activeFilter !== 'trip' && driverFilter !== 'all') {
      if (car.driver !== 'both' && car.driver !== driverFilter) return false;
    }

    const search = (searchQuery || "").toLowerCase().trim();
    if (!search) return true;
    const carName = (car.name || "").toLowerCase();

    if (carName.includes(search)) return true;

    const match = modelInfo[search];
    if (match) {
      if (carName.includes(match.brand)) return true;
      if (carName.includes(match.en)) return true;
    }

    const arabicBrands: Record<string, string> = {
      'بي ام': 'bmw', 'مرسيدس': 'mercedes', 'بورشه': 'porsche', 'تويوتا': 'toyota',
      'نيسان': 'nissan', 'هيونداي': 'hyundai', 'هوندا': 'honda', 'بيجو': 'peugeot',
      'ميتسوبيشي': 'mitsubishi', 'رنج روفر': 'range rover', 'رانج روفر': 'range rover',
      'شيفروليه': 'chevrolet', 'كيا': 'kia', 'رينو': 'renault',
    };
    return Object.entries(arabicBrands).some(
      ([ar, en]) => ar.includes(search) && carName.includes(en)
    );
  }), [cars, activeFilter, driverFilter, favorites, searchQuery]);

  /* ── scroll (throttled) + outside-click ── */
  useEffect(() => {
    startTransition(() => setMounted(true));
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false; });
        ticking = true;
      }
    };
    const onOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousedown", onOutside);
    return () => { window.removeEventListener("scroll", onScroll); document.removeEventListener("mousedown", onOutside); };
  }, []);

  /* ── PWA banner: once per week ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const os = getOS();
    if (os === 'other') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    const lastShown = localStorage.getItem('pwa_banner_ts');
    const ONE_WEEK  = 7 * 24 * 60 * 60 * 1000;
    if (!lastShown || Date.now() - Number(lastShown) > ONE_WEEK) {
      const t = setTimeout(() => setShowInstallBanner(true), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  /* ── Notification: check expiring ads ── */
  useEffect(() => {
    if (!user) return;
    const checkExpiry = async () => {
      try {
        const q = query(
          collection(db, "cars"),
          where("status", "==", "active"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const now = Date.now();
        const expiring: typeof notifications = [];
        snap.forEach(d => {
          const d2 = d.data();
          if (d2.expiryDate) {
            const exp = d2.expiryDate.toDate ? d2.expiryDate.toDate() : new Date(d2.expiryDate);
            const days = Math.ceil((exp.getTime() - now) / (1000 * 60 * 60 * 24));
            if (days >= 0 && days <= 3) {
              expiring.push({ carId: d.id, carName: d2.name || '', daysLeft: days, expiryDate: exp });
            }
          }
        });
        setNotifications(expiring);
      } catch {}
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const dismissBanner = () => { setShowInstallBanner(false); localStorage.setItem('pwa_banner_ts', String(Date.now())); };

  /* ── Pagination state ── */
  const lastDocRef = useRef<any>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const mobileObserverRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef(0);
  const PAGE_SIZE = 6;

  const sortFn = (a: any, b: any) => {
    const aVIP = a.isVIP === true || a.isVIP === 'true' ? 1 : 0;
    const bVIP = b.isVIP === true || b.isVIP === 'true' ? 1 : 0;
    return bVIP - aVIP;
  };

  const fetchCars = useCallback(async () => {
    setLoading(true);
    // Show cached data immediately if available (stale-while-revalidate)
    try {
      const cached = localStorage.getItem('luxe_cars_cache');
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 24 * 60 * 60 * 1000) {
          const sorted = [...data].sort(sortFn);
          setCars(sorted);
          setLoading(false);
        }
      }
    } catch (_) {}
    try {
      const q = query(collection(db, "cars"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = [...data].sort(sortFn);
      setCars(sorted);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
      setInitialLoadDone(true);
      try { localStorage.setItem('luxe_cars_cache', JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
    } catch (err) { console.error("Firebase:", err); setLoading(false); setInitialLoadDone(true); }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "cars"),
        where("status", "==", "active"),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = [...data].sort(sortFn);
      setCars(prev => [...prev, ...sorted]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) { console.error("loadMore error:", err); }
    finally { setLoadingMore(false); }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    startTransition(() => {
      fetchCars();
    });
  }, [fetchCars]);

  /* ── IntersectionObserver for infinite scroll ── */
  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    const target = mobileObserverRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  /* ── search suggestions ── */
  const [suggestions, setSuggestions] = useState<any[]>([]);
  useEffect(() => {
    if (searchQuery.length > 0) {
      startTransition(() => {
        setSuggestions(displayCars.slice(0, 5));
        setShowSuggestions(true);
      });
    } else {
      startTransition(() => {
        setSuggestions([]);
        setShowSuggestions(false);
      });
    }
  }, [searchQuery, displayCars]);

  const handleSelectCar = (car: any) => {
    document.body.style.overflow = 'hidden';
    const images = Array.isArray(car.image) ? car.image : car.image ? [car.image] : ['/placeholder-car.png'];
    setSelectedCar({ ...car, images });
    setCurrentImageIndex(0); setShowSuggestions(false); setIsClosing(false);
    updateDoc(doc(db, "cars", car.id), { views: increment(1) }).catch(() => {});
  };

  const handleCloseModal = () => { document.body.style.overflow = ''; setIsClosing(true); setTimeout(() => { setSelectedCar(null); setIsClosing(false); }, 300); };

  /* ── Share inside modal ── */
  const handleShare = async () => {
    if (!selectedCar) return;
    await shareCar(selectedCar);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  const blurAmount    = Math.max(4, 18 - (scrollY / 500) * 14);
  const headerOpacity = Math.max(0, 1 - scrollY / 600);

  return (
    <main className="relative min-h-screen text-[#1a1a1a] overflow-x-hidden font-sans selection:bg-black selection:text-white">

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/f30-refined.jpg" alt="BMW F30 Background"
          fill priority className="object-cover"
          style={{ filter: `blur(${blurAmount}px)`, transition: 'filter 0.08s linear', transform: 'scale(1.05)' }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* ── PWA Banner ── */}
      {showInstallBanner && <InstallBanner onDismiss={dismissBanner} />}

      {/* ════ NAV ════ */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0a] text-white px-6 md:px-12 py-5 hidden md:flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex-1 flex flex-col items-start cursor-default group">
          <div className="relative">
            <span className="font-serif text-2xl font-bold text-white tracking-tight transition-all duration-700 group-hover:text-[#c5a059]">JOY DRIVE</span>
            <div className="absolute -bottom-1 left-0 h-[1px] w-0 bg-[#c5a059] transition-all duration-700 group-hover:w-full" />
          </div>
        </div>

        <div ref={searchRef} className="flex-[1.5] max-w-sm hidden md:flex flex-col relative mx-4">
          <div className="relative flex items-center w-full">
            <Search size={14} className="absolute left-4 text-zinc-400" />
            <input
              type="text" placeholder={t.nav.search}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              className="w-full bg-white/10 border border-white/10 py-2 pl-11 pr-4 rounded-full text-[11px] outline-none transition-all focus:bg-white/20 focus:border-white/30 text-white placeholder:text-zinc-500"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black rounded-2xl shadow-2xl overflow-hidden z-[150] border border-zinc-100">
              {suggestions.map(car => (
                <div key={car.id}
                  onClick={() => { setSearchQuery(car.name); setShowSuggestions(false); handleSelectCar(car); }}
                  className="px-5 py-3 hover:bg-zinc-50 cursor-pointer flex justify-between items-center border-b border-zinc-50 last:border-none"
                >
                  <span className="text-[11px] font-medium">{car.name}</span>
                   <span className="text-[9px] opacity-40 uppercase tracking-widest">{formatPrice(car.price)} {t.carCard.egp}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowSupport(!showSupport)}
              className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center hover:bg-zinc-800 transition-all shadow-lg active:scale-90"
              title={t.nav.support}
            >
              <Phone size={15} className="text-white" />
            </button>
            {showSupport && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200] p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-[#c5a059]/20 flex items-center justify-center mx-auto mb-3">
                  <Phone size={20} className="text-[#c5a059]" />
                </div>
                <p className="text-white text-sm font-bold">{t.nav.support}</p>
                <a
                  href={`https://wa.me/${myWhatsAppNumber}`}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-[#20bd5a] transition-all active:scale-95"
                >
                  <MessageCircle size={14} />
                  {t.nav.whatsapp}
                </a>
                <a
                  href={`tel:+${myWhatsAppNumber}`}
                  className="mt-2 inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-white/20 transition-all active:scale-95 w-full justify-center"
                >
                  <Phone size={14} />
                  {t.nav.call}
                </a>
                <button
                  onClick={() => setShowSupport(false)}
                  className="mt-3 text-[9px] text-zinc-400 hover:text-zinc-300 transition-all"
                >
                  {t.nav.close}
                </button>
              </div>
            )}
          </div>

          {/* Language Toggle - Desktop */}
          <button
            onClick={toggleLang}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-[9px] font-bold tracking-widest"
            title={lang === 'ar' ? 'العربية (اضغط للتغيير)' : 'English (click to change)'}
          >
            {lang === 'ar' ? 'AR' : 'EN'}
          </button>

          {!authLoading && (
            user && userProfile ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2.5 rounded-full hover:bg-white/20 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#c5a059]/20 flex items-center justify-center">
                    <User size={14} className="text-[#c5a059]" />
                  </div>
                  <span className="text-[10px] font-bold tracking-[1px] hidden md:block truncate max-w-[80px]">
                    {userProfile.displayName || 'User'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]">
                    <Link href="/add-ad" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] border-b border-white/5">
                      <Plus size={14} className="text-green-400" />
                      {t.nav.addListing}
                    </Link>
                    <Link href="/my-ads" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] border-b border-white/5">
                      <Heart size={14} className="text-white/50" />
                      {t.nav.myAds}
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] border-b border-white/5">
                        <Star size={14} className="text-[#c5a059]" />
                        {t.nav.adminPanel}
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] text-red-400"
                    >
                      <LogOut size={14} />
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                  href="/login"
                  className="flex items-center gap-2 bg-[#c5a059]/10 border border-[#c5a059]/30 px-4 py-2.5 rounded-full hover:bg-[#c5a059]/20 transition-all group"
                >
                  <User size={13} className="text-[#c5a059]" />
                  <span className="text-[9px] font-bold tracking-[2px] uppercase text-[#c5a059]">{t.nav.signIn}</span>
                </Link>
            )
          )}
        </div>
      </nav>

      {/* ════ CONTENT ════ */}
      <div className="relative z-10 hidden md:block">
        <header className="px-6 md:px-10 pt-44 md:pt-56 pb-24 max-w-7xl mx-auto transition-opacity duration-500" style={{ opacity: headerOpacity }}>
          <h1 className="font-serif text-7xl md:text-[10rem] font-light leading-[0.8] tracking-tighter text-white drop-shadow-2xl">
            Elite <br />
            <span className="italic ml-6 md:ml-32 text-white/50">Selection.</span>
          </h1>
          <div className="mt-20 max-w-3xl ml-auto border-r-2 border-white/40 pr-10">
            <p className="text-right leading-tight" style={{ fontFamily: "'Playfair Display','Noto Naskh Arabic',Georgia,serif" }}>
              <span className="text-white/60 font-light text-xl md:text-[1.8rem]">نقدم تجربة استثنائية تتجاوز مجرد استئجار سيارة؛ نصمم</span>
              <br />
              <span className="text-white font-semibold italic text-2xl md:text-[2rem] drop-shadow-lg">لحظات تليق بك وبتفاصيلك الخاصة.</span>
            </p>
          </div>
        </header>

        {/* Fleet */}
        <section ref={fleetRef} className="max-w-7xl mx-auto px-4 md:px-6 pb-40">
          {/* ── Filter Bar ── */}
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {[
              { key: 'trip', label: t.filters.trips, icon: null, gold: true },
              { key: 'all', label: t.filters.cars, icon: null },
              { key: 'wedding', label: t.filters.wedding, icon: null },
              { key: 'rental', label: t.filters.rental, icon: null },
              { key: 'package', label: t.filters.package, icon: null, gold: true },
              { key: 'flowers', label: t.filters.flowers, icon: null },
              { key: 'favorites', label: `${t.filters.favorites} (${cars.filter(c => favorites.includes(c.id)).length})`, icon: null },
            ].map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key as any)}
                className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[2px] transition-all border ${
                  activeFilter === f.key
                    ? 'bg-white/20 text-white border-white/30 shadow-lg'
                    : 'bg-transparent text-white/40 border-white/10 hover:text-white/60'
                } ${f.gold ? 'ring-1 ring-[#c5a059]/30' : ''}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Driver Filter (only for wedding/rental) ── */}
          {(activeFilter === 'wedding' || activeFilter === 'rental') && (
            <div className="flex flex-wrap gap-3 mb-10 justify-center">
              {[
                { key: 'all', label: t.driver.all },
                { key: 'with', label: t.driver.with },
                { key: 'without', label: t.driver.without },
              ].map(f => (
                <button key={f.key} onClick={() => setDriverFilter(f.key as any)}
                  className={`px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-[2px] transition-all border ${
                    driverFilter === f.key
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-transparent text-white/40 border-white/10 hover:text-white/60'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {(loading || (!initialLoadDone && cars.length === 0 && !searchQuery)) ? (
            activeFilter === 'trip' ? (
              <div className="space-y-4 md:space-y-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/10 backdrop-blur-md animate-pulse flex">
                    <div className="w-[120px] md:w-[180px] h-[140px] md:h-[180px] bg-white/10 flex-shrink-0" />
                    <div className="flex-1 p-5 space-y-3">
                      <div className="h-4 w-32 bg-white/20 rounded-full" />
                      <div className="h-3 w-24 bg-white/20 rounded-full" />
                      <div className="h-3 w-48 bg-white/20 rounded-full" />
                      <div className="flex justify-between items-center">
                        <div className="h-5 w-20 bg-white/20 rounded-full" />
                        <div className="flex gap-2">
                          <div className="h-8 w-20 bg-white/20 rounded-full" />
                          <div className="h-8 w-16 bg-white/20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/10 backdrop-blur-md animate-pulse">
                    <div className="h-[58vw] md:h-72 bg-white/10" />
                    <div className="px-6 py-5 bg-black/40 flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-3 w-16 bg-white/20 rounded-full" />
                        <div className="h-5 w-24 bg-white/20 rounded-full" />
                      </div>
                      <div className="h-10 w-20 bg-white/20 rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : displayCars.length > 0 ? (
            <>
            {activeFilter === 'trip' ? (
              <div className="space-y-4 md:space-y-6">
                {displayCars.map((trip, index) => (
                  <TripCard key={trip.id} trip={trip} index={index}
                    isFavorited={favorites.includes(trip.id)}
                    onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(trip.id); }}
                  />
                ))}
              </div>
            ) : activeFilter === 'all' ? (
              /* ── Desktop: Sections (horizontal scroll per category) ── */
              (() => {
                const packages = displayCars.filter(c => c.category === 'car_package');
                const weddingCars = displayCars.filter(c => c.category === 'car_wedding');
                const rentalCars = displayCars.filter(c => c.category === 'car_rental');
                const flowers = displayCars.filter(c => c.category === 'flowers' || c.bouquetName);
                const trips = displayCars.filter(c => c.category === 'trip');
                const sections = [
                  { key: 'car_package', items: packages, label: t.filters.package },
                  { key: 'car_wedding', items: weddingCars, label: t.filters.wedding },
                  { key: 'car_rental', items: rentalCars, label: t.filters.rental },
                  { key: 'flowers', items: flowers, label: t.filters.flowers },
                  { key: 'trip', items: trips, label: t.filters.trips },
                ];
                return (
                  <div className="space-y-16">
                    {sections.map(s => s.items.length > 0 && (
                      <div key={s.key}>
                        <div className="flex items-center gap-4 mb-8">
                          <h2 className="text-white/50 text-[10px] font-black uppercase tracking-[5px]">{s.label}</h2>
                          <div className="h-px flex-1 bg-white/10" />
                          <span className="text-white/20 text-[10px] font-mono">{s.items.length}</span>
                        </div>
                        <div className="relative group">
                          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
                            style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
                            {s.items.map((car, idx) => (
                              <div key={car.id} className="w-[380px] shrink-0 snap-start">
                                <CarCard car={car} index={idx}
                                  onClick={() => handleSelectCar(car)}
                                  onShare={e => { e.stopPropagation(); shareCar(car); }}
                                  isFavorited={favorites.includes(car.id)}
                                  onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(car.id); }}
                                />
                              </div>
                            ))}
                            <button onClick={(e) => {
                              const p = (e.currentTarget.parentElement as HTMLElement);
                              if (p) p.scrollBy({ left: dir === 'rtl' ? -400 : 400, behavior: 'smooth' });
                            }}
                              className="w-[50px] shrink-0 flex items-center justify-center text-white/20 hover:text-white/60 transition-all snap-start opacity-0 group-hover:opacity-100">
                              <ChevronRight size={18} className={`transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(hasMore || loadingMore) && (
                      <div ref={observerRef} className="flex justify-center py-12">
                        {loadingMore ? (
                          <div className="flex items-center gap-3 text-white/40">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                            <span className="text-[10px] uppercase tracking-[3px]">{t.common.loading}</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
                {displayCars.map((car, index) => (
                  <CarCard key={car.id} car={car} index={index}
                    onClick={() => handleSelectCar(car)}
                    onShare={e => { e.stopPropagation(); shareCar(car); }}
                    isFavorited={favorites.includes(car.id)}
                    onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(car.id); }}
                  />
                ))}
              </div>
              {(hasMore || loadingMore) && (
                <div ref={observerRef} className="flex justify-center py-12">
                  {loadingMore ? (
                    <div className="flex items-center gap-3 text-white/40">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      <span className="text-[10px] uppercase tracking-[3px]">{t.common.loading}</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6" />
                  )}
                </div>
              )}
              </>
            )}
            </>
          ) : (
            <div className="py-20 text-center">
              <Search size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/40 font-serif italic">{t.common.noResults}</p>
            </div>
          )}
        </section>
      </div>

      {/* ════ MODAL ════ */}
      {selectedCar && (
        <div
          className={`fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={e => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className={`
            relative w-full bg-white shadow-2xl overflow-hidden
            flex flex-col rounded-t-[2rem] max-h-[92dvh]
            md:flex-row md:rounded-[2.5rem] md:max-h-[88vh] md:max-w-6xl
            transition-all duration-300
            ${isClosing ? 'translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}
          `}>

            {/* ── X button ── */}
            <button onClick={handleCloseModal} aria-label="Close"
              className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-xl border border-white/20 active:scale-90 transition-all duration-300 group">
              <X size={16} className="transition-transform duration-500 group-hover:rotate-90" />
            </button>

            {/* ── Image panel ── */}
            <div className="relative bg-zinc-900 flex-shrink-0 h-[48vw] min-h-[200px] max-h-[280px] md:h-auto md:w-3/5 md:max-h-[88vh]"
              onTouchStart={e => { touchStartXRef.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                const diff = touchStartXRef.current - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 50) {
                  if (diff > 0) setCurrentImageIndex(p => (p + 1) % selectedCar.images.length);
                  else setCurrentImageIndex(p => (p - 1 + selectedCar.images.length) % selectedCar.images.length);
                }
              }}>
              <Image
                src={optimizeImage(selectedCar.images[currentImageIndex], 800)}
                alt={selectedCar.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover cursor-zoom-in transition-opacity duration-500 select-none"
                draggable={false}
                onClick={() => setZoomedImage(selectedCar.images[currentImageIndex])}
              />
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white rounded-full px-3 py-1 flex items-center gap-1.5 pointer-events-none">
                <ZoomIn size={11} />
                <span className="text-[8px] tracking-widest"> </span>
              </div>
              {selectedCar.images.length > 1 && ( 
                <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                  <button className="pointer-events-auto w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all"
                    onClick={e => { e.stopPropagation(); setCurrentImageIndex(p => (p - 1 + selectedCar.images.length) % selectedCar.images.length); }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button className="pointer-events-auto w-10 h-10 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all"
                    onClick={e => { e.stopPropagation(); setCurrentImageIndex(p => (p + 1) % selectedCar.images.length); }}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
              {selectedCar.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                  {selectedCar.images.map((_: any, i: number) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Info panel ── */}
            <div
              className="flex-1 bg-[#F5F4F1] flex flex-col overflow-y-auto px-5 pt-5 pb-6 md:w-2/5 md:px-10 md:pt-10 md:pb-10"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* ── Car name + Share button ── */}
              <div className="mb-1 pr-12 md:pr-0">
                {/* اسم العربية */}
                <h2 className="text-3xl md:text-5xl font-black text-black leading-tight tracking-tight">
                  {selectedCar.name}
                </h2>
                <p className="text-[9px] text-zinc-400 uppercase tracking-[4px] mt-2 font-bold">
                  {selectedCar.category === 'trip' ? t.detail.tripService : t.detail.premiumClass}
                </p>

                {/* ── Share button — تحت الاسم مباشرة ── */}
                <button
                  onClick={handleShare}
                  className="mt-4 flex items-center gap-2 bg-black text-white pl-4 pr-5 py-2.5 rounded-full shadow-md hover:bg-zinc-800 active:scale-95 transition-all duration-300 group"
                  title={t.detail.shareTooltip}
                >
                  {copied
                    ? <Check size={14} className="text-green-400" />
                    : <Share2 size={14} className="text-white" />
                  }
                  <span className="text-[10px] font-bold uppercase tracking-[2px]">
                    {copied ? t.detail.copied : t.detail.share}
                  </span>
                </button>
              </div>

              {/* Description */}
              {selectedCar.description && (
                <p className="text-zinc-600 text-sm leading-relaxed text-right font-medium italic mt-4 md:mt-6 border-r-2 border-zinc-300 pr-4" dir="rtl">
                  {selectedCar.description}
                </p>
              )}

              {/* ── Trip route info ── */}
              {selectedCar.category === 'trip' && (selectedCar.fromLocation || selectedCar.toLocation) && (
                <div className="mt-5 bg-white rounded-[1.2rem] border border-zinc-200 shadow-sm p-5">
                  <div className="flex items-center gap-4 justify-center">
                    {selectedCar.fromLocation && (
                      <div className="text-center">
                        <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">{t.detail.from}</p>
                        <p className="text-lg font-bold text-black mt-1">{selectedCar.fromLocation}</p>
                      </div>
                    )}
                    <div className="text-zinc-300 text-2xl">→</div>
                    {selectedCar.toLocation && (
                      <div className="text-center">
                        <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">{t.detail.to}</p>
                        <p className="text-lg font-bold text-black mt-1">{selectedCar.toLocation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Package Details ── */}
              {selectedCar.category === 'car_package' && selectedCar.packageDetails && (
                <div className="mt-5 bg-white rounded-[1.2rem] border border-zinc-200 shadow-sm p-5">
                  <p className="text-[8px] font-black uppercase tracking-[5px] text-center text-zinc-400 mb-3">
                    {t.detail.packageIncludes}
                  </p>
                  <div className="space-y-2" dir="rtl">
                    {selectedCar.packageDetails.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3">
                        <div className="w-6 h-6 rounded-full bg-[#c5a059]/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-black text-[#c5a059]">{i + 1}</span>
                        </div>
                        <p className="text-[13px] font-medium text-zinc-700">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Smart Calendar (معلق) ── */}
              {false && (() => {
                return <div />;
              })()}

              {/* CTA */}
              <div className="mt-5 flex gap-3 md:relative md:mt-5 md:bg-transparent md:p-0 sticky bottom-0 bg-[#F5F4F1] pt-4 pb-3 -mx-5 px-5 md:mx-0 md:px-0 md:pt-0 md:pb-0 md:sticky-none">
                <a href={`https://wa.me/${selectedCar.whatsapp || selectedCar.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiry + selectedCar.name)}`} target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all">
                  <MessageCircle size={16} /> {t.detail.whatsapp}
                </a>
                <a href={`tel:+${selectedCar.phone || selectedCar.whatsapp || myWhatsAppNumber}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all">
                  <Phone size={16} /> {t.detail.call}
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════ ZOOM LIGHTBOX ════ */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <Image src={optimizeImage(zoomedImage, 1200)} alt="Zoomed"
            fill
            unoptimized
            className="object-contain rounded-2xl shadow-2xl select-none"
            style={{ animation: 'zoomIn 0.25s ease-out' }}
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/40 text-[10px] tracking-[4px] uppercase">{t.detail.closeZoom}</p>
        </div>
      )}
      {zoomedImage && (
        <button className="fixed top-4 right-4 z-[301] w-12 h-12 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white shadow-lg hover:bg-white/20 transition-all" onClick={() => setZoomedImage(null)}>
          <X size={22} className="transition-transform duration-500 hover:rotate-90" />
        </button>
      )}

      {/* ════ MOBILE LAYOUT ════ */}
      <div className="block md:hidden relative z-10">
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-white tracking-tight">JOY DRIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-all relative">
                <Bell size={14} className="text-white/70" />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[7px] font-bold flex items-center justify-center shadow-lg shadow-red-500/30">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="fixed top-14 left-4 right-4 z-[200] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-white text-sm font-bold">الإشعارات</p>
                  </div>
                  {notifications.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <a key={n.carId}
                          href={`https://wa.me/${myWhatsAppNumber}?text=${encodeURIComponent('مرحباً، أريد تجديد إعلان ' + n.carName)}`}
                          target="_blank"
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-all border-b border-white/5 last:border-none"
                          onClick={() => setShowNotifications(false)}>
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                            <Bell size={13} className="text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[12px] font-bold truncate">{n.carName}</p>
                            <p className="text-yellow-400/80 text-[9px]">{n.daysLeft === 0 ? 'ينتهي اليوم!' : `متبقي ${n.daysLeft} أيام`}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-zinc-500 text-[12px]">لا توجد إشعارات</p>
                    </div>
                  )}
                  <button onClick={() => setShowNotifications(false)}
                    className="w-full py-3 text-[10px] text-zinc-600 hover:text-zinc-400 transition-all border-t border-white/5">
                    إغلاق
                  </button>
                </div>
              )}
            </div>
            {!authLoading && (
              user && userProfile ? (
                <button onClick={() => setMobileTab('more')}
                  className="w-9 h-9 rounded-full bg-[#c5a059]/20 flex items-center justify-center">
                  <User size={14} className="text-[#c5a059]" />
                </button>
              ) : (
                <Link href="/login"
                  className="w-9 h-9 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center">
                  <User size={14} className="text-[#c5a059]" />
                </Link>
              )
            )}
          </div>
        </div>

        <div className="pt-20">

        {/* Mobile Content */}
        <div className="pb-20 min-h-screen">
          {/* Mobile Hero — Arabic always, fades on scroll */}
          <div className="px-4 pt-4 pb-1 text-center transition-opacity duration-500" style={{ opacity: Math.max(0, 1 - scrollY / 400) }}>
            <p className="text-white/90 text-sm leading-relaxed" style={{ fontFamily: "'Playfair Display','Noto Naskh Arabic',Georgia,serif" }}>
              نقدم تجربة استثنائية تتجاوز مجرد استئجار سيارة؛
              <br />
              <span className="font-semibold italic">نصمم لحظات تليق بك وبتفاصيلك الخاصة.</span>
            </p>
          </div>
          {/* Mobile Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative flex items-center w-full">
              <Search size={14} className="absolute right-4 text-zinc-500" />
              <input
                type="text" placeholder={t.nav.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 py-3 pr-11 pl-4 rounded-2xl text-[12px] outline-none text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* Mobile Tab Content */}
          {mobileTab === 'home' && (
            <div className="px-4 pb-6">
              {/* Category chips - horizontal scroll */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                {[
                  { key: 'all', label: t.filters.all },
                  { key: 'wedding', label: t.filters.wedding },
                  { key: 'rental', label: t.filters.rental },
                  { key: 'package', label: t.filters.package },
                  { key: 'flowers', label: t.filters.flowers },
                  { key: 'trip', label: t.filters.trips },
                  { key: 'favorites', label: `${t.filters.favorites} (${cars.filter(c => favorites.includes(c.id)).length})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setActiveFilter(f.key as any)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold transition-all border shrink-0 ${
                      activeFilter === f.key
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-white/10 text-white/60 border-white/10'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Driver sub-filter */}
              {(activeFilter === 'wedding' || activeFilter === 'rental') && (
                <div className="flex gap-2 overflow-x-auto pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {[
                    { key: 'all', label: t.driver.all },
                    { key: 'with', label: t.driver.with },
                    { key: 'without', label: t.driver.without },
                  ].map(f => (
                    <button key={f.key} onClick={() => setDriverFilter(f.key as any)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[9px] font-bold transition-all border shrink-0 ${
                        driverFilter === f.key
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-transparent text-white/40 border-white/10'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading state */}
              {loading ? (
                activeFilter === 'all' ? (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-4 -mx-4 snap-x snap-mandatory scrollbar-none">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-[68vw] shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-white/10 shimmer snap-center animate-pulse">
                      <div className="h-36 bg-white/5" />
                      <div className="p-4 space-y-2 bg-black/40">
                        <div className="h-3 w-16 bg-white/10 rounded-full" />
                        <div className="h-4 w-24 bg-white/10 rounded-full" />
                        <div className="h-3 w-20 bg-white/10 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                <div className="grid grid-cols-2 gap-3 pb-4 pt-2 px-4 -mx-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-white/10 shimmer animate-pulse">
                      <div className="aspect-square bg-white/5" />
                      <div className="p-3 space-y-2">
                        <div className="h-2 w-12 bg-white/10 rounded-full" />
                        <div className="h-3 w-20 bg-white/10 rounded-full" />
                        <div className="h-3 w-16 bg-white/10 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                )
              ) : displayCars.length > 0 ? (
                activeFilter === 'all' ? (
                (() => {
                  const packages = displayCars.filter(c => c.category === 'car_package');
                  const weddingCars = displayCars.filter(c => c.category === 'car_wedding');
                  const rentalCars = displayCars.filter(c => c.category === 'car_rental');
                  const flowers = displayCars.filter(c => c.category === 'flowers' || c.bouquetName);
                  const trips = displayCars.filter(c => c.category === 'trip');
                  const sections = [
                    { key: 'car_package', items: packages, label: t.filters.package, simple: false },
                    { key: 'car_wedding', items: weddingCars, label: t.filters.wedding, simple: false },
                    { key: 'car_rental', items: rentalCars, label: t.filters.rental, simple: false },
                    { key: 'flowers', items: flowers, label: t.filters.flowers, simple: true },
                    { key: 'trip', items: trips, label: t.filters.trips, simple: true },
                  ];
                  return (
                    <div className="space-y-5 pb-4">
                      {sections.map(s => s.items.length > 0 && (
                        <div key={s.key}>
                          <h3 className="text-white/70 text-[11px] font-bold uppercase tracking-[3px] px-4 mb-2">
                            {dir === 'rtl' ? (
                              <>{s.label} — <span className="text-white/40">{s.items.length}</span></>
                            ) : (
                              <><span className="text-white/40">{s.items.length}</span> — {s.label}</>
                            )}
                          </h3>
                          <div className="relative group">
                            <div className="flex gap-3 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-none snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}>
                            {s.items.map(car => (
                              <div key={car.id} onClick={() => handleSelectCar(car)}
                                className="relative w-[60vw] shrink-0 snap-start rounded-xl overflow-hidden border border-white/20 bg-white/10 active:scale-[0.97] transition-all">
                                <div className="relative h-32 w-full">
                                  <Image
                                    src={optimizeImage(Array.isArray(car.image) ? car.image[0] : car.image, 400)}
                                    alt={car.name}
                                    fill unoptimized className="object-cover"
                                  />
                                </div>
                                <div className="p-2.5">
                                  {s.simple ? (
                                    <>
                                      <h3 className="text-sm font-bold text-white leading-tight truncate">{car.bouquetName || car.name}</h3>
                                      {car.description && <p className="text-[9px] text-white/50 mt-0.5 line-clamp-2">{car.description}</p>}
                                      <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-extrabold text-white">{formatPrice(car.price)} <span className="text-[7px] text-zinc-400">{t.carCard.egp}</span></p>
                                        <div className="flex gap-1">
                                          <a href={`https://wa.me/${car.whatsapp || car.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiry + (car.bouquetName || car.name))}`}
                                            onClick={e => e.stopPropagation()}
                                            className="bg-[#25D366] p-1.5 rounded-full">
                                            <MessageCircle size={10} className="text-white" />
                                          </a>
                                          <a href={`tel:+${car.phone || car.whatsapp || myWhatsAppNumber}`}
                                            onClick={e => e.stopPropagation()}
                                            className="bg-white/20 p-1.5 rounded-full">
                                            <Phone size={10} className="text-white" />
                                          </a>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">
                                        {car.driver && car.driver !== 'both' ? (car.driver === 'with' ? t.driver.with : t.driver.without) : ''}
                                      </p>
                                      <h3 className="text-sm font-bold text-white leading-tight truncate">{car.name}</h3>
                                      <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-extrabold text-white">{formatPrice(car.price)} <span className="text-[7px] text-zinc-400">{t.carCard.egp}</span></p>
                                        <div className="flex gap-1">
                                          <a href={`https://wa.me/${car.whatsapp || car.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiry + car.name)}`}
                                            onClick={e => e.stopPropagation()}
                                            className="bg-[#25D366] p-1.5 rounded-full">
                                            <MessageCircle size={10} className="text-white" />
                                          </a>
                                          <a href={`tel:+${car.phone || car.whatsapp || myWhatsAppNumber}`}
                                            onClick={e => e.stopPropagation()}
                                            className="bg-white/20 p-1.5 rounded-full">
                                            <Phone size={10} className="text-white" />
                                          </a>
                                          <button
                                            onClick={e => { e.stopPropagation(); toggleFavorite(car.id); }}
                                            className="p-1.5 rounded-full bg-white/20 flex items-center justify-center">
                                            <Heart size={9} className={`${favorites.includes(car.id) ? 'text-red-400 fill-red-400' : 'text-white'}`} />
                                          </button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                              <button onClick={(e) => {
                                const p = ((e.currentTarget.parentElement as HTMLElement)?.parentElement as HTMLElement)?.querySelector('.snap-x') as HTMLElement;
                                if (p) p.scrollBy({ left: dir === 'rtl' ? -300 : 300, behavior: 'smooth' });
                              }}
                                className="w-[40px] shrink-0 flex items-center justify-center text-white/20 hover:text-white/60 transition-all snap-start">
                                <ChevronRight size={16} className={`transition-transform ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(hasMore || loadingMore) && (
                        <div ref={mobileObserverRef} className="flex justify-center py-4">
                          {loadingMore ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                          ) : (
                            <div className="w-5 h-5" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()
                ) : (
                /* ── Vertical grid (for specific filters) ── */
                <div className="grid grid-cols-2 gap-3 pb-4 pt-2 px-4 -mx-4">
                  {displayCars.map(car => (
                    <div key={car.id} onClick={() => handleSelectCar(car)}
                      className={`relative rounded-xl overflow-hidden border border-white/20 bg-white/10 active:scale-[0.97] transition-all ${
                        car.isVIP ? 'ring-1 ring-[#D4AF37]' : ''
                      }`}>
                      {car.isVIP && (
                        <div className="absolute top-2 left-2 z-10 bg-[#D4AF37] px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                          <Star size={6} fill="white" stroke="none" />
                          <span className="text-[5px] font-black text-white">{t.carCard.vip}</span>
                        </div>
                      )}
                      <div className="relative aspect-square w-full">
                        <Image
                          src={optimizeImage(Array.isArray(car.image) ? car.image[0] : car.image, 300)}
                          alt={car.name}
                          fill unoptimized className="object-cover"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-[7px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
                          {car.category === 'car_wedding' ? t.filters.wedding : car.category === 'car_rental' ? t.filters.rental : car.category === 'flowers' ? t.filters.flowers : car.category === 'trip' ? t.filters.trips : car.category === 'car_package' ? t.filters.package : ''}
                        </p>
                        <h3 className="text-xs font-bold text-white leading-tight truncate">{car.name}</h3>
                        <div className="flex gap-1.5 mt-1">
                          <a href={`https://wa.me/${car.whatsapp || car.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiry + car.name)}`}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#25D366] p-1.5 rounded-full flex-1 flex items-center justify-center gap-1">
                            <MessageCircle size={9} className="text-white" />
                            <span className="text-[6px] text-white font-bold">{t.detail.whatsapp}</span>
                          </a>
                          <a href={`tel:+${car.phone || car.whatsapp || myWhatsAppNumber}`}
                            onClick={e => e.stopPropagation()}
                            className="bg-white/20 p-1.5 rounded-full flex items-center justify-center">
                            <Phone size={9} className="text-white" />
                          </a>
                          <button
                            onClick={e => { e.stopPropagation(); toggleFavorite(car.id); }}
                            className="p-1.5 rounded-full bg-white/20 flex items-center justify-center">
                            <Heart size={9} className={`${favorites.includes(car.id) ? 'text-red-400 fill-red-400' : 'text-white'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(hasMore || loadingMore) && (
                    <div ref={mobileObserverRef} className="col-span-2 flex justify-center py-4">
                      {loadingMore ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                    </div>
                  )}
                </div>
                )
              ) : (
                <div className="py-16 text-center">
                  <Search size={36} className="mx-auto text-white/30 mb-3" />
                  <p className="text-white/40 font-serif italic text-sm">{t.common.noResults}</p>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {mobileTab === 'favorites' && (
            <div className="px-4 pb-6">
              <h2 className="font-serif text-lg italic text-white mb-4">{t.mobileNav.favorites}</h2>
              {cars.filter(c => favorites.includes(c.id) && c.status === 'active').length > 0 ? (
                <div className="space-y-4">
                  {cars.filter(c => favorites.includes(c.id) && c.status === 'active').map(car => (
                    <div key={car.id} onClick={() => handleSelectCar(car)}
                      className="rounded-2xl overflow-hidden border border-white/20 bg-white/10 active:scale-[0.98] transition-all flex">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image src={optimizeImage(Array.isArray(car.image) ? car.image[0] : car.image, 400)}
                          alt={car.name} fill unoptimized className="object-cover" />
                      </div>
                      <div className="flex-1 p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-extrabold text-white truncate">{car.name}</h3>
                          <div className="flex gap-1 mt-1.5">
                            <a href={`https://wa.me/${car.whatsapp || car.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiry + car.name)}`}
                              onClick={e => e.stopPropagation()}
                              className="bg-[#25D366] p-1 rounded-full flex items-center justify-center">
                              <MessageCircle size={9} className="text-white" />
                            </a>
                            <a href={`tel:+${car.phone || car.whatsapp || myWhatsAppNumber}`}
                              onClick={e => e.stopPropagation()}
                              className="bg-white/20 p-1 rounded-full flex items-center justify-center">
                              <Phone size={9} className="text-white" />
                            </a>
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleFavorite(car.id); }}
                          className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                          <Heart size={11} className="text-red-400 fill-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Heart size={40} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/40 text-sm font-serif italic">{t.common.noFavorites}</p>
                </div>
              )}
            </div>
          )}

          {/* More Tab */}
          {mobileTab === 'more' && (
            <div className="px-4 pb-6">
              <h2 className="font-serif text-lg italic text-white mb-6">{t.mobileNav.more}</h2>
              <div className="space-y-3">
                {user && userProfile ? (
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#c5a059]/20 flex items-center justify-center">
                        <User size={20} className="text-[#c5a059]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-bold">{userProfile.displayName || 'User'}</p>
                        <p className="text-white/40 text-[10px]">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <Link href="/my-ads"
                  onClick={() => setMobileTab('home')}
                  className="flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all">
                  <Heart size={18} className="text-white/60" />
                  <span className="text-white text-sm">{t.more.myAds}</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin"
                    onClick={() => setMobileTab('home')}
                    className="flex items-center gap-3 bg-[#c5a059]/10 rounded-2xl p-4 border border-[#c5a059]/20 hover:bg-[#c5a059]/20 transition-all">
                    <Star size={18} className="text-[#c5a059]" />
                    <span className="text-[#c5a059] text-sm font-bold">{t.more.admin}</span>
                  </Link>
                )}
                <Link href="/add-ad"
                  onClick={() => setMobileTab('home')}
                  className="flex items-center gap-3 bg-green-500/10 rounded-2xl p-4 border border-green-500/20 hover:bg-green-500/20 transition-all">
                  <Plus size={18} className="text-green-400" />
                  <span className="text-green-400 text-sm font-bold">{t.more.addAd}</span>
                </Link>
                <button onClick={() => setShowSupport(!showSupport)}
                  className="w-full flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all text-right">
                  <Phone size={18} className="text-white/60" />
                  <span className="text-white text-sm">{t.more.support}</span>
                </button>
                {user ? (
                  <button onClick={() => { signOut(); setMobileTab('home'); }}
                    className="w-full flex items-center gap-3 bg-red-500/10 rounded-2xl p-4 border border-red-500/20 hover:bg-red-500/20 transition-all text-right">
                    <LogOut size={18} className="text-red-400" />
                    <span className="text-red-400 text-sm">{t.more.logout}</span>
                  </button>
                ) : (
                  <Link href="/login"
                    onClick={() => setMobileTab('home')}
                    className="flex items-center gap-3 bg-[#c5a059]/10 rounded-2xl p-4 border border-[#c5a059]/20 hover:bg-[#c5a059]/20 transition-all">
                    <User size={18} className="text-[#c5a059]" />
                    <span className="text-[#c5a059] text-sm">{t.more.login}</span>
                  </Link>
                )}

                {/* Language toggle - Mobile */}
                <button onClick={toggleLang}
                  className="w-full flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all text-right">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span className="text-white text-sm">{t.more.language}: <span className="font-bold">{lang === 'ar' ? 'العربية' : 'English'}</span></span>
                </button>

                {/* Instagram */}
                <a href="#" target="_blank" rel="noopener noreferrer"
                  onClick={e => { e.preventDefault(); alert('قريباً...'); }}
                  className="w-full flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all text-right">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <span className="text-white text-sm">{t.more.instagram}</span>
                </a>

                {/* Facebook */}
                <a href="#" target="_blank" rel="noopener noreferrer"
                  onClick={e => { e.preventDefault(); alert('قريباً...'); }}
                  className="w-full flex items-center gap-3 bg-white/10 rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all text-right">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  <span className="text-white text-sm">{t.more.facebook}</span>
                </a>
              </div>

              {showSupport && (
                <div className="mt-4 bg-white/10 rounded-2xl p-5 border border-white/10 text-center">
                  <p className="text-white text-sm font-bold mb-3">{t.more.support}</p>
                  <div className="flex gap-3 justify-center">
                    <a href={`https://wa.me/${myWhatsAppNumber}`} target="_blank"
                      className="bg-[#25D366] text-white px-5 py-2.5 rounded-full text-[10px] font-bold flex items-center gap-2">
                      <MessageCircle size={14} /> {t.nav.whatsapp}
                    </a>
                    <a href={`tel:+${myWhatsAppNumber}`}
                      className="bg-white/20 text-white px-5 py-2.5 rounded-full text-[10px] font-bold flex items-center gap-2">
                      <Phone size={14} /> {t.nav.call}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Bottom Navigation - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
          <div className="flex items-center justify-around py-2 px-2">
            <button onClick={() => { setMobileTab('home'); setActiveFilter('all'); }}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${mobileTab === 'home' ? 'text-[#c5a059]' : 'text-white/40'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="text-[8px] font-bold tracking-[0.5px]">{t.mobileNav.home}</span>
            </button>
            <button onClick={() => setMobileTab('favorites')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${mobileTab === 'favorites' ? 'text-[#c5a059]' : 'text-white/40'}`}>
              <Heart size={20} />
              <span className="text-[8px] font-bold tracking-[0.5px]">{t.mobileNav.favorites}</span>
            </button>
            <Link href="/add-ad"
              className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl -mt-3">
              <div className="w-12 h-12 rounded-full bg-[#c5a059] text-black flex items-center justify-center shadow-lg shadow-[#c5a059]/30">
                <Plus size={22} />
              </div>
            </Link>
            <button onClick={() => { setActiveFilter('rental'); setMobileTab('home'); }}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${mobileTab === 'home' && activeFilter === 'rental' ? 'text-[#c5a059]' : 'text-white/40'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span className="text-[8px] font-bold tracking-[0.5px]">{t.mobileNav.rental}</span>
            </button>
            <button onClick={() => setMobileTab('more')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${mobileTab === 'more' ? 'text-[#c5a059]' : 'text-white/40'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              <span className="text-[8px] font-bold tracking-[0.5px]">{t.mobileNav.more}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════ FOOTER ════ */}
      <footer className="relative z-10 py-16 bg-[#0a0a0a] border-t border-white/5 text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black uppercase tracking-[6px]">ZaFah</p>
            <p className="text-[9px] font-bold tracking-[4px] opacity-40 uppercase">{t.common.excellenceDefined}</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" target="_blank" title="Instagram" className="text-white/30 hover:text-[#c5a059] transition-all duration-300"
              onClick={e => { e.preventDefault(); alert('قريباً...'); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" target="_blank" title="Facebook" className="text-white/30 hover:text-[#c5a059] transition-all duration-300"
              onClick={e => { e.preventDefault(); alert('قريباً...'); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 transition-all duration-700" />
            <p className="font-serif italic text-lg text-zinc-400">
              {t.common.developedBy} <span className="text-white font-bold ml-1">usf</span>
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap');
        @keyframes zoomIn {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </main>
  );
}

/* ════════════════════════════════════
   CAR CARD — Floating Luxury
════════════════════════════════════ */
function CarCard({ car, index = 0, onClick, onShare, isFavorited, onToggleFavorite }: {
  car: any; index?: number; onClick?: () => void; onShare?: (e: React.MouseEvent) => void;
  isFavorited?: boolean; onToggleFavorite?: (e: React.MouseEvent) => void;
}) {
  const { t } = useLanguage();
  const myWhatsAppNumber = "201095976766";
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="absolute -inset-1 rounded-[2rem] bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 backdrop-blur-md bg-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-500 group-hover:-translate-y-1 active:scale-[0.98]">

        <div className="relative h-[58vw] md:h-72 overflow-hidden">
          <Image
            src={optimizeImage(Array.isArray(car.image) ? car.image[0] : car.image, 400)}
            alt={car.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 3}
            className="object-cover transition-transform duration-[2s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          {/* ── Quick Preview overlay ── */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <span className="px-6 py-3 rounded-full border border-white/40 text-white text-[10px] font-bold uppercase tracking-[3px] backdrop-blur-md bg-white/10 hover:bg-white hover:text-black transition-all duration-300">
              {t.carCard.view}
            </span>
          </div>

          {/* Badges row */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">

            {/* VIP + Share + Fave دايرة تحتيه */}
            <div className="flex flex-col items-start gap-2">
              {(car.isVIP === true || car.isVIP === 'true') && (
                <div className="bg-[#D4AF37] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <Star size={10} fill="white" stroke="none" />
                  <span className="text-[8px] font-black tracking-[2px] uppercase">{t.carCard.vipChoice}</span>
                </div>
              )}
              {/* ── Favorite Heart ── */}
              <button
                onClick={onToggleFavorite}
                className={`w-8 h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 shadow-md ${
                  isFavorited
                    ? 'bg-red-500/20 border-red-400/50'
                    : 'bg-white/20 border-white/30 hover:bg-white'
                }`}
                title={isFavorited ? t.detail.favoriteRemove : t.detail.favoriteAdd}
              >
                <Heart size={13} className={`transition-colors ${isFavorited ? 'text-red-400 fill-red-400' : 'text-white'}`} />
              </button>
              {/* ── Share button ── */}
              <button
                onClick={onShare}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white active:scale-90 transition-all duration-300 group/share shadow-md"
                title={t.detail.shareTooltip}
              >
                <Share2 size={13} className="text-white group-hover/share:text-black transition-colors" />
              </button>
            </div>

            <div className="bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
              <span className="text-[8px] font-bold tracking-[2px] uppercase">{car.category === 'car_package' ? t.carCard.package : car.category === 'flowers' ? t.carCard.flowers : car.category === 'trip' ? t.carCard.trip : t.carCard.activeFleet}</span>
            </div>
          </div>

          {/* Car name bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight tracking-tight">{car.name}</h3>
            <p className="text-[8px] text-white/50 uppercase tracking-[4px] font-bold mt-1">
              {car.category === 'car_package' ? `${car.packageDetails?.split('\n').filter((l: string) => l.trim()).length || 0} ${t.carCard.cars}` : car.category === 'flowers' ? t.carCard.flowerBouquet : car.category === 'trip' ? t.carCard.tripService : t.carCard.premiumClass}
            </p>
          </div>
        </div>

          {/* Contact strip */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <a href={`https://wa.me/${car.whatsapp || car.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiry + car.name)}`}
              target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-2 rounded-xl text-[8px] font-bold uppercase tracking-[1px] hover:opacity-90 transition-all active:scale-95">
              <MessageCircle size={11} /> {t.detail.whatsapp}
            </a>
            <a href={`tel:+${car.phone || car.whatsapp || myWhatsAppNumber}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-white/10 text-white px-3 py-2 rounded-xl text-[8px] font-bold uppercase tracking-[1px] hover:bg-white/20 transition-all active:scale-95 border border-white/10">
              <Phone size={11} /> {t.detail.call}
            </a>
          </div>
          <div className="flex items-center gap-2 bg-white/10 active:bg-white hover:bg-white group/btn rounded-2xl px-5 py-3 border border-white/20 transition-all duration-300">
            <span className="text-[10px] font-extrabold uppercase tracking-[3px] text-white group-hover/btn:text-black transition-colors">{t.carCard.view}</span>
            <ChevronRight size={14} className="text-white group-hover/btn:text-black transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   TRIP CARD — Horizontal List Layout
════════════════════════════════════ */
function TripCard({ trip, index = 0, isFavorited, onToggleFavorite }: {
  trip: any; index?: number;
  isFavorited?: boolean; onToggleFavorite?: (e: React.MouseEvent) => void;
}) {
  const { t, dir } = useLanguage();
  const imageUrl = optimizeImage(
    Array.isArray(trip.image) ? trip.image[0] : trip.image || '/placeholder-car.png',
    400
  );
  const myWhatsAppNumber = "201095976766";

  return (
    <>
      <div className="group relative bg-[#0a0a0a] backdrop-blur-xl border border-white/15 rounded-[1.8rem] md:rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-[0_20px_60px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 transition-all duration-500">
        <div className="flex flex-row">
          <div
            className="relative w-[95px] md:w-[200px] flex-shrink-0 overflow-hidden rounded-r-[1.8rem] md:rounded-r-[2rem]"
          >
            <div className="h-full min-h-[120px] md:min-h-[200px] relative">
              <Image
                src={imageUrl}
                alt={trip.name}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="200px"
              />
            </div>
            <button onClick={onToggleFavorite}
              className={`absolute top-2 left-2 w-7 h-7 md:w-8 md:h-8 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 shadow-md z-10 ${
                isFavorited ? 'bg-red-500/20 border-red-400/50' : 'bg-white/20 border-white/30 hover:bg-white'
              }`}>
              <Heart size={11} className={`transition-colors ${isFavorited ? 'text-red-400 fill-red-400' : 'text-white'}`} />
            </button>
          </div>

          <div className="flex-1 p-2.5 md:p-6 flex flex-col justify-center text-right" dir={dir}>
            <div>
              <h3 className="font-serif text-sm md:text-2xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display',Georgia,serif" }}>
                {trip.name}
              </h3>
              {(trip.fromLocation || trip.toLocation) && (
                <p className="text-indigo-300/80 text-[9px] md:text-[12px] mt-0.5 md:mt-1">
                  <span dir="ltr">{trip.fromLocation || '...'} → {trip.toLocation || '...'}</span>
                </p>
              )}
              {trip.description && (
                <p className="text-white/70 text-[10px] md:text-[13px] mt-1 leading-relaxed line-clamp-2">
                  {trip.description}
                </p>
              )}
            </div>

            <div className="flex md:items-center justify-between mt-2 md:mt-5 gap-1.5 md:gap-0 flex-col md:flex-row">
                <div className="flex gap-1.5 order-2 md:order-1">
                  <a href={`https://wa.me/${trip.whatsapp || trip.phone || myWhatsAppNumber}?text=${encodeURIComponent(t.chat.inquiryTrip + trip.name)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-[#25D366] text-white px-2 md:px-3 py-1.5 md:py-2 rounded-full text-[7px] md:text-[9px] font-bold uppercase tracking-wider hover:bg-[#20bd5a] transition-all active:scale-95 shadow-md">
                    <MessageCircle size={9} /> {t.detail.whatsapp}
                  </a>
                  <a href={`tel:+${trip.phone || trip.whatsapp || myWhatsAppNumber}`}
                    className="flex items-center gap-1 bg-white/10 text-white px-2 md:px-3 py-1.5 md:py-2 rounded-full text-[7px] md:text-[9px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all active:scale-95 border border-white/10">
                    <Phone size={9} /> {t.detail.call}
                  </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    </>
  );
}
