// @ts-nocheck
'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Phone, X, ChevronRight, ChevronLeft, MessageCircle, Star, Search, ZoomIn, Download, Share2, Check, User, LogOut, Plus, Heart, Flower2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, increment, query, where, setDoc, deleteDoc, serverTimestamp, orderBy, limit, startAfter } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

/* ─── Optimize Cloudinary image URL ─── */
function optimizeImage(url: string, width: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,w_${width},q_auto/`);
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
  const title = `${car.name} — ZaFah Luxury Rental`;
  const text  = `${car.name} متاحة للإيجار بسعر ${car.price} EGP / يوم 🚗`;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(url);
  }
}

/* ─── PWA Install Banner ─── */
function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
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
            <p className="text-white text-sm font-bold">أضف ZaFah لشاشتك</p>
            <p className="text-white/40 text-[10px] tracking-wider uppercase">تجربة تطبيق كاملة</p>
          </div>
        </div>
        <div className="space-y-2.5 text-right" dir="rtl">
          {[
            ['١', 'اضغط زرار', 'Share', 'في أسفل المتصفح'],
            ['٢', 'اختار', '"Add to Home Screen"', ''],
            ['٣', 'اضغط', '"Add"', 'وهيظهر زي أي تطبيق'],
          ].map(([n, pre, gold, post]) => (
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
          <p className="text-white text-sm font-bold">ثبّت تطبيق ZaFah</p>
          <p className="text-white/50 text-[11px]">أسرع وشغّال حتى بدون نت</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleAndroidInstall} className="bg-[#c5a059] text-black text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-2xl active:scale-95 transition-all">ثبّت</button>
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
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading]           = useState(true);
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

  const [activeFilter, setActiveFilter] = useState<'all' | 'wedding' | 'rental' | 'flowers' | 'trip' | 'favorites'>('all');
  const [driverFilter, setDriverFilter] = useState<'all' | 'with' | 'without'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  const { user, userProfile, loading: authLoading, isAdmin, signOut } = useAuth();

  /* ── Favorites management ── */
  useEffect(() => {
    if (user) {
      const migrateAndFetch = async () => {
        try {
          const localRaw = localStorage.getItem('zafah_favorites');
          const localFavs = localRaw ? JSON.parse(localRaw) : [];
          const q = query(collection(db, 'favorites'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          const firestoreFavs = snap.docs.map(d => d.data().carId);
          const merged = [...new Set([...localFavs, ...firestoreFavs])];
          setFavorites(merged);
          const diff = localFavs.filter(id => !firestoreFavs.includes(id));
          if (diff.length > 0) {
            await Promise.all(diff.map(carId =>
              setDoc(doc(db, 'favorites', `${user.uid}_${carId}`), {
                userId: user.uid, carId, createdAt: serverTimestamp(),
              })
            ));
          }
          localStorage.removeItem('zafah_favorites');
        } catch (err) { console.error('Favorites sync error:', err); }
      };
      migrateAndFetch();
    } else {
      try {
        const stored = localStorage.getItem('zafah_favorites');
        if (stored) setFavorites(JSON.parse(stored));
      } catch {}
    }
  }, [user]);

  const toggleFavorite = async (carId: string) => {
    const isFav = favorites.includes(carId);
    setFavorites(prev => {
      const updated = isFav ? prev.filter(id => id !== carId) : prev.includes(carId) ? prev : [...prev, carId];
      if (!user) {
        try { localStorage.setItem('zafah_favorites', JSON.stringify(updated)); } catch {}
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

  const displayCars = (cars || []).filter((car) => {
    // Only show active (published) ads
    if (car.status && car.status !== 'active') return false;

    // Filter by favorites
    if (activeFilter === 'favorites') {
      return favorites.includes(car.id);
    }

    // Filter by category
    if (activeFilter === 'flowers' && car.category !== 'flowers' && !car.bouquetName) return false;
    if (activeFilter === 'trip' && car.category !== 'trip') return false;
    if (activeFilter === 'wedding' && car.category !== 'car_wedding') return false;
    if (activeFilter === 'rental' && car.category !== 'car_rental') return false;
    if (activeFilter === 'all' && (car.category === 'flowers' || car.bouquetName || car.category === 'trip')) return false;

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
  });

  /* ── scroll + outside-click ── */
  useEffect(() => {
    setMounted(true);
    const onScroll  = () => setScrollY(window.scrollY);
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

  const dismissBanner = () => { setShowInstallBanner(false); localStorage.setItem('pwa_banner_ts', String(Date.now())); };

  /* ── Pagination state ── */
  const lastDocRef = useRef<any>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 6;

  const sortFn = (a: any, b: any) => {
    const aVIP = a.isVIP === true || a.isVIP === 'true' ? 1 : 0;
    const bVIP = b.isVIP === true || b.isVIP === 'true' ? 1 : 0;
    return bVIP - aVIP;
  };

  const fetchCars = async () => {
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
      try { localStorage.setItem('luxe_cars_cache', JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
    } catch (err) { console.error("Firebase:", err); setLoading(false); }
  };

  const loadMore = async () => {
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
  };

  useEffect(() => {
    fetchCars();
  }, []);

  /* ── IntersectionObserver for infinite scroll ── */
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMore();
      }
    }, { rootMargin: '200px' });
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, cars]);

  /* ── search suggestions ── */
  useEffect(() => {
    if (searchQuery.length > 0) {
      const f = displayCars.slice(0, 5);
      setSuggestions(f); setShowSuggestions(true);
    } else { setSuggestions([]); setShowSuggestions(false); }
  }, [searchQuery, activeFilter, driverFilter, favorites, cars]);

  const handleSelectCar = (car: any) => {
    const images = Array.isArray(car.image) ? car.image : car.image ? [car.image] : ['/placeholder-car.png'];
    setSelectedCar({ ...car, images });
    setCurrentImageIndex(0); setShowSuggestions(false); setIsClosing(false);
    updateDoc(doc(db, "cars", car.id), { views: increment(1) }).catch(() => {});
  };

  const handleCloseModal = () => { setIsClosing(true); setTimeout(() => { setSelectedCar(null); setIsClosing(false); }, 300); };

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
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0a] text-white px-6 md:px-12 py-5 flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex-1 flex flex-col items-start cursor-default group">
          <div className="relative">
            <span className="font-serif text-2xl font-bold text-white tracking-tight transition-all duration-700 group-hover:text-[#c5a059]">ZaFah</span>
            <div className="absolute -bottom-1 left-0 h-[1px] w-0 bg-[#c5a059] transition-all duration-700 group-hover:w-full" />
          </div>
          <span className="text-[7px] tracking-[0.7em] text-zinc-500 uppercase mt-1.5">Luxury Rental</span>
        </div>

        <div ref={searchRef} className="flex-[1.5] max-w-sm hidden md:flex flex-col relative mx-4">
          <div className="relative flex items-center w-full">
            <Search size={14} className="absolute left-4 text-zinc-400" />
            <input
              type="text" placeholder="Search fleet..."
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
                  <span className="text-[9px] opacity-40 uppercase tracking-widest">{car.price} EGP</span>
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
              title="الدعم الفني"
            >
              <Phone size={15} className="text-white" />
            </button>
            {showSupport && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200] p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-[#c5a059]/20 flex items-center justify-center mx-auto mb-3">
                  <Phone size={20} className="text-[#c5a059]" />
                </div>
                <p className="text-white text-sm font-bold">الدعم الفني</p>
                <p className="text-zinc-400 text-[10px] mt-1">تواصل معنا واتساب</p>
                <a
                  href={`https://wa.me/${myWhatsAppNumber}`}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-[#20bd5a] transition-all active:scale-95"
                >
                  <MessageCircle size={14} />
                  واتساب
                </a>
                <a
                  href={`tel:+${myWhatsAppNumber}`}
                  className="mt-2 inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[2px] hover:bg-white/20 transition-all active:scale-95 w-full justify-center"
                >
                  <Phone size={14} />
                  اتصال
                </a>
                <button
                  onClick={() => setShowSupport(false)}
                  className="mt-3 text-[9px] text-zinc-600 hover:text-zinc-400 transition-all"
                >
                  إغلاق
                </button>
              </div>
            )}
          </div>

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
                      إضافة إعلان
                    </Link>
                    <Link href="/my-ads" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] border-b border-white/5">
                      <Heart size={14} className="text-white/50" />
                      إعلاناتي
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] border-b border-white/5">
                        <Star size={14} className="text-[#c5a059]" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-all text-[11px] text-red-400"
                    >
                      <LogOut size={14} />
                      تسجيل خروج
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
                  <span className="text-[9px] font-bold tracking-[2px] uppercase text-[#c5a059]">Sign In</span>
                </Link>
            )
          )}
        </div>
      </nav>

      {/* ════ CONTENT ════ */}
      <div className="relative z-10">
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
              { key: 'trip', label: '🗺️ Trips', icon: null, gold: true },
              { key: 'all', label: '🚗 cars', icon: null },
              { key: 'wedding', label: '🎊 zafah', icon: null },
              { key: 'rental', label: '🚙 Rental', icon: null },
              { key: 'flowers', label: '💐 Flowers', icon: null },
              { key: 'favorites', label: `❤️ Favorite (${cars.filter(c => favorites.includes(c.id)).length})`, icon: null },
            ].map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key as any)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[2px] transition-all border ${
                  activeFilter === f.key
                    ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-lg'
                    : f.gold
                      ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30 hover:bg-[#c5a059]/20'
                      : 'bg-white/10 text-white/60 border-white/10 hover:bg-white/20 hover:text-white'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Driver Filter (only for wedding/rental) ── */}
          {(activeFilter === 'wedding' || activeFilter === 'rental') && (
            <div className="flex flex-wrap gap-3 mb-10 justify-center">
              {[
                { key: 'all', label: 'الكل' },
                { key: 'with', label: '👤 بسائق' },
                { key: 'without', label: '🚗 بدون سائق' },
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

          {(loading || (cars.length === 0 && !searchQuery)) ? (
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
            ) : (
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
            )}
            {(hasMore || loadingMore) && (
              <div ref={observerRef} className="flex justify-center py-12">
                {loadingMore ? (
                  <div className="flex items-center gap-3 text-white/40">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    <span className="text-[10px] uppercase tracking-[3px]">Loading more...</span>
                  </div>
                ) : (
                  <div className="w-6 h-6" />
                )}
              </div>
            )}
            </>
          ) : (
            <p className="py-20 text-center text-white/40 font-serif italic">No vehicles matching your search found.</p>
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
            <div className="relative bg-zinc-900 flex-shrink-0 h-[48vw] min-h-[200px] max-h-[280px] md:h-auto md:w-3/5 md:max-h-[88vh]">
              <Image
                src={optimizeImage(selectedCar.images[currentImageIndex], 800)}
                alt={selectedCar.name}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover cursor-zoom-in transition-opacity duration-500"
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
                <h2
                  className="font-serif text-3xl md:text-5xl font-semibold italic text-black leading-tight"
                  style={{ fontFamily: "'Playfair Display',Georgia,serif" }}
                >
                  {selectedCar.name}
                </h2>
                <p className="text-[9px] text-zinc-400 uppercase tracking-[4px] mt-2 font-bold">
                  {selectedCar.category === 'trip' ? 'Trip Service' : 'Premium Class'}
                </p>

                {/* ── Share button — تحت الاسم مباشرة ── */}
                <button
                  onClick={handleShare}
                  className="mt-4 flex items-center gap-2 bg-black text-white pl-4 pr-5 py-2.5 rounded-full shadow-md hover:bg-zinc-800 active:scale-95 transition-all duration-300 group"
                  title="Share"
                >
                  {copied
                    ? <Check size={14} className="text-green-400" />
                    : <Share2 size={14} className="text-white" />
                  }
                  <span className="text-[10px] font-bold uppercase tracking-[2px]">
                    {copied ? 'تم النسخ!' : 'Share'}
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
                        <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">من</p>
                        <p className="text-lg font-bold text-black mt-1">{selectedCar.fromLocation}</p>
                      </div>
                    )}
                    <div className="text-zinc-300 text-2xl">→</div>
                    {selectedCar.toLocation && (
                      <div className="text-center">
                        <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold">إلى</p>
                        <p className="text-lg font-bold text-black mt-1">{selectedCar.toLocation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Smart Calendar ── */}
              {selectedCar.category !== 'trip' && (() => {
                const now        = new Date();
                const year       = now.getFullYear();
                const month      = now.getMonth(); // 0-indexed
                const today      = now.getDate();
                const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

                // خلايا فاضية قبل أول يوم في الشهر
                const blanks = Array.from({ length: firstDay });
                const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

                return (
                  <div className="mt-5 bg-white rounded-[1.2rem] border border-zinc-200 shadow-sm p-4 md:p-6">
                    {/* Header */}
                    <p className="text-[8px] font-black uppercase tracking-[5px] text-center text-zinc-400 mb-1">
                      Availability Schedule
                    </p>
                    {/* Month + Year */}
                    <p className="text-[13px] font-extrabold text-center text-black mb-1">
                      {monthNames[month]} {year}
                    </p>
                    <p className="text-[11px] text-center text-red-500 font-bold mb-4" dir="rtl">
                      🔴 الأيام الحمراء محجوزة مسبقاً
                    </p>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="text-[7px] font-black uppercase text-zinc-300 text-center">{d}</div>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {/* blank cells */}
                      {blanks.map((_, i) => <div key={`b${i}`} />)}

                      {/* actual days */}
                      {days.map(day => {
                        const booked  = selectedCar.bookedDays?.includes(day);
                        const isToday = day === today;
                        return (
                          <div key={day} className="flex items-center justify-center">
                            <span className={`
                              text-[11px] w-7 h-7 flex items-center justify-center rounded-full font-bold transition-all duration-200
                              ${booked
                                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                : isToday
                                  ? 'bg-black text-white font-bold'
                                  : 'text-zinc-600'
                              }
                            `}>
                              {day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* CTA */}
              <div className="mt-5 flex gap-3">
                <a href={`https://wa.me/${selectedCar.whatsapp || selectedCar.phone || myWhatsAppNumber}?text=${encodeURIComponent("مرحباً، أنا مهتم بـ " + selectedCar.name)}`} target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all">
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={`tel:+${selectedCar.phone || selectedCar.whatsapp || myWhatsAppNumber}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all">
                  <Phone size={16} /> Call
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════ ZOOM LIGHTBOX ════ */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <Image src={zoomedImage} alt="Zoomed"
            fill
            className="object-contain rounded-2xl shadow-2xl select-none"
            style={{ animation: 'zoomIn 0.25s ease-out' }}
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/40 text-[10px] tracking-[4px] uppercase">اضغط خارج الصورة للإغلاق</p>
        </div>
      )}
      {zoomedImage && (
        <button className="fixed top-4 right-4 z-[301] w-12 h-12 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white shadow-lg hover:bg-white/20 transition-all" onClick={() => setZoomedImage(null)}>
          <X size={22} className="transition-transform duration-500 hover:rotate-90" />
        </button>
      )}

      {/* ════ FOOTER ════ */}
      <footer className="relative z-10 py-16 bg-[#0a0a0a] border-t border-white/5 text-white">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black uppercase tracking-[6px]">ZaFah</p>
            <p className="text-[9px] font-bold tracking-[4px] opacity-40 uppercase">Excellence Defined</p>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 transition-all duration-700" />
            <p className="font-serif italic text-lg text-zinc-400">
              Developed by <span className="text-white font-bold ml-1">usf</span>
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
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="absolute -inset-1 rounded-[2rem] bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 backdrop-blur-md bg-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-500 group-hover:-translate-y-1 active:scale-[0.98]">

        <div className="relative h-[58vw] md:h-72 overflow-hidden">
          <Image
            src={optimizeImage(Array.isArray(car.image) ? car.image[0] : car.image, 400)}
            alt={car.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 3}
            className="object-cover transition-transform duration-[2s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Badges row */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">

            {/* VIP + Share + Fave دايرة تحتيه */}
            <div className="flex flex-col items-start gap-2">
              {(car.isVIP === true || car.isVIP === 'true') && (
                <div className="bg-[#D4AF37] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <Star size={10} fill="white" stroke="none" />
                  <span className="text-[8px] font-black tracking-[2px] uppercase">VIP Choice</span>
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
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={13} className={`transition-colors ${isFavorited ? 'text-red-400 fill-red-400' : 'text-white'}`} />
              </button>
              {/* ── Share button ── */}
              <button
                onClick={onShare}
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white active:scale-90 transition-all duration-300 group/share shadow-md"
                title="Share"
              >
                <Share2 size={13} className="text-white group-hover/share:text-black transition-colors" />
              </button>
            </div>

            <div className="bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
              <span className="text-[8px] font-bold tracking-[2px] uppercase">Active Fleet</span>
            </div>
          </div>

          {/* Car name bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <h3 className="font-serif text-2xl md:text-3xl italic text-white leading-tight drop-shadow-lg">{car.name}</h3>
            <p className="text-[8px] text-white/50 uppercase tracking-[4px] font-bold mt-1">Premium Class</p>
          </div>
        </div>

          {/* Price strip */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 bg-black/60 backdrop-blur-sm">
          <div>
            <p className="text-[9px] text-white/60 uppercase tracking-[3px] font-bold">
              {car.category === 'car_rental' ? 'Per Day' : car.category === 'flowers' ? 'Price' : 'Per Day'}
            </p>
            <p className="text-xl md:text-2xl font-extrabold text-white mt-0.5">
              {car.price} <span className="text-[11px] text-white/60 font-bold">EGP</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 active:bg-white hover:bg-white group/btn rounded-2xl px-5 py-3 border border-white/20 transition-all duration-300">
            <span className="text-[10px] font-extrabold uppercase tracking-[3px] text-white group-hover/btn:text-black transition-colors">View</span>
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

          <div className="flex-1 p-2.5 md:p-6 flex flex-col justify-center text-right" dir="rtl">
            <div>
              <h3 className="font-serif text-sm md:text-2xl italic text-white font-semibold leading-tight">
                {trip.name}
              </h3>
              {(trip.fromLocation || trip.toLocation) && (
                <p className="text-indigo-300/80 text-[9px] md:text-[12px] mt-0.5 md:mt-1">
                  🗺️ <span dir="ltr">{trip.fromLocation || '...'} → {trip.toLocation || '...'}</span>
                </p>
              )}
              {trip.description && (
                <p className="text-white/70 text-[10px] md:text-[13px] mt-1 leading-relaxed line-clamp-2">
                  {trip.description}
                </p>
              )}
            </div>

            <div className="flex md:items-center justify-between mt-2 md:mt-5 gap-1.5 md:gap-0 flex-col md:flex-row">
              <p className="text-sm md:text-2xl font-extrabold text-white order-2 md:order-1">
                {trip.price} <span className="text-[8px] md:text-[11px] text-zinc-400 font-bold">EGP</span>
              </p>
              <div className="flex gap-1.5 order-1 md:order-2">
                <a href={`https://wa.me/${trip.whatsapp || trip.phone || myWhatsAppNumber}?text=${encodeURIComponent("مرحباً، أنا مهتم بـ " + trip.name)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-[#25D366] text-white px-2 md:px-5 py-1.5 md:py-2.5 rounded-full text-[7px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-[#20bd5a] transition-all active:scale-95 shadow-md">
                  <MessageCircle size={10} /> WhatsApp
                </a>
                <a href={`tel:+${trip.phone || trip.whatsapp || myWhatsAppNumber}`}
                  className="flex items-center gap-1 bg-white/10 text-white px-2 md:px-5 py-1.5 md:py-2.5 rounded-full text-[7px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-all active:scale-95 shadow-md border border-white/10">
                  <Phone size={10} /> Call
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
