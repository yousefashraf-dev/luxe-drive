// @ts-nocheck
'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Phone, X, ChevronRight, ChevronLeft, MessageCircle, Star, Search, ZoomIn, Download, Share2, Link2, Check } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, increment } from 'firebase/firestore';

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

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function Home() {
  const [cars, setCars]                 = useState<any[]>([]);
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
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

  const searchRef = useRef<HTMLDivElement>(null);
  const fleetRef  = useRef<HTMLDivElement>(null);
  const myWhatsAppNumber = "201095976766";

  /* ── Arabic + direct search ── */
  const displayCars = (cars || []).filter((car) => {
    const search = (searchQuery || "").toLowerCase();
    if (!search) return true;
    const carName  = (car.name  || "").toLowerCase();
    const carBrand = (car.brand || "").toLowerCase();
    const translations: { [key: string]: string } = {
      'بي ام': 'bmw', 'مرسيدس': 'mercedes', 'بورشه': 'porsche', 'تويوتا': 'toyota'
    };
    const matchesDirect = carName.includes(search) || carBrand.includes(search);
    const matchesArabic = Object.keys(translations).some(
      k => search.includes(k) && (carName.includes(translations[k]) || carBrand.includes(translations[k]))
    );
    return matchesDirect || matchesArabic;
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

  /* ── Firebase + localStorage cache ── */
  useEffect(() => {
    const sortFn = (a: any, b: any) => {
      const aVIP = a.isVIP === true || a.isVIP === 'true' ? 1 : 0;
      const bVIP = b.isVIP === true || b.isVIP === 'true' ? 1 : 0;
      return bVIP - aVIP;
    };

    const fetchFromFirebase = async (updateCache = true) => {
      try {
        const snap   = await getDocs(collection(db, "cars"));
        const data   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = [...data].sort(sortFn);
        setCars(sorted); setFilteredCars(sorted); setLoading(false);
        if (updateCache) {
          try { localStorage.setItem('luxe_cars_cache', JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
        }
      } catch (err) { console.error("Firebase:", err); setLoading(false); }
    };

    const fetchCars = async () => {
      // 1) show cache instantly
      try {
        const raw = localStorage.getItem('luxe_cars_cache');
        if (raw) {
          const { data, ts } = JSON.parse(raw);
          if (Date.now() - ts < 5 * 60 * 1000) {
            const sorted = [...data].sort(sortFn);
            setCars(sorted); setFilteredCars(sorted); setLoading(false);
            // refresh silently in background
            fetchFromFirebase(true);
            return;
          }
        }
      } catch (_) {}
      // 2) no valid cache → fetch directly
      await fetchFromFirebase(true);
    };

    fetchCars();
  }, []);

  /* ── search suggestions ── */
  useEffect(() => {
    if (searchQuery.length > 0) {
      const f = cars.filter(c => c?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      setSuggestions(f.slice(0, 5)); setShowSuggestions(true);
    } else { setSuggestions([]); setShowSuggestions(false); }
  }, [searchQuery, cars]);

  const handleSelectCar = (car: any) => {
    const images = Array.isArray(car.image) ? car.image : car.image ? [car.image] : ['/placeholder-car.jpg'];
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

      {/* ── Admin ── */}
      <div className="fixed top-28 right-6 z-[110]">
        <a href="/admin" className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-500 border border-white/20">
          <span className="text-[10px] font-bold">USF</span>
        </a>
      </div>

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

        <div className="flex-1 flex justify-end items-center gap-6">
          <span className="text-[9px] tracking-[5px] font-bold uppercase opacity-50 hidden lg:block text-zinc-400">Luxury Service</span>
          <a href={`tel:+${myWhatsAppNumber}`} className="text-[9px] font-bold tracking-[3px] uppercase border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all">Connect</a>
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
          {(loading || (cars.length === 0 && !searchQuery)) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
              {[1,2,3].map(i => (
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
          ) : displayCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
              {displayCars.map((car, index) => (
                <CarCard key={car.id} car={car} index={index}
                  onClick={() => handleSelectCar(car)}
                  onShare={e => { e.stopPropagation(); shareCar(car); }}
                />
              ))}
            </div>
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
              <img
                src={selectedCar.images[currentImageIndex]}
                alt={selectedCar.name}
                className="w-full h-full object-cover cursor-zoom-in transition-opacity duration-500"
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
                  className="font-serif text-3xl md:text-5xl font-light italic text-black leading-tight"
                  style={{ fontFamily: "'Playfair Display',Georgia,serif" }}
                >
                  {selectedCar.name}
                </h2>
                <div className="h-[1px] w-14 bg-black/30 mt-3" />
                <p className="text-[8px] text-zinc-400 uppercase tracking-[4px] mt-2 font-bold">Premium Class</p>

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
                <p className="text-zinc-500 text-sm leading-relaxed text-right font-light italic mt-4 md:mt-6 border-r-2 border-zinc-200 pr-4" dir="rtl">
                  {selectedCar.description}
                </p>
              )}

              {/* ── Smart Calendar ── */}
              {(() => {
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
                    <p className="text-[11px] font-bold text-center text-black mb-1">
                      {monthNames[month]} {year}
                    </p>
                    <p className="text-[10px] text-center text-red-500 font-medium mb-4" dir="rtl">
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
                              text-[10px] w-7 h-7 flex items-center justify-center rounded-full font-medium transition-all duration-200
                              ${booked
                                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                : isToday
                                  ? 'bg-black text-white font-bold'
                                  : 'text-zinc-400'
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
                <a href={`https://wa.me/${selectedCar.phone || myWhatsAppNumber}`} target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all">
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={`tel:+${selectedCar.phone || myWhatsAppNumber}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg active:scale-95 transition-all">
                  <Phone size={16} /> Reserve
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ════ ZOOM LIGHTBOX ════ */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all group z-10" onClick={() => setZoomedImage(null)}>
            <X size={22} className="transition-transform duration-500 group-hover:rotate-90" />
          </button>
          <img src={zoomedImage} alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
            style={{ animation: 'zoomIn 0.25s ease-out' }}
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/40 text-[10px] tracking-[4px] uppercase">اضغط خارج الصورة للإغلاق</p>
        </div>
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
function CarCard({ car, index = 0, onClick, onShare }: {
  car: any; index?: number; onClick?: () => void; onShare?: (e: React.MouseEvent) => void;
}) {
  const isEager = index < 3;
  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="absolute -inset-1 rounded-[2rem] bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 backdrop-blur-md bg-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-500 group-hover:-translate-y-1 active:scale-[0.98]">

        <div className="relative h-[58vw] md:h-72 overflow-hidden">
          <img
            src={Array.isArray(car.image) ? car.image[0] : car.image}
            alt={car.name}
            loading={isEager ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : isEager ? "auto" : "low"}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Badges row */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">

            {/* VIP + Share دايرة تحتيه */}
            <div className="flex flex-col items-start gap-2">
              {(car.isVIP === true || car.isVIP === 'true') && (
                <div className="bg-[#D4AF37] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                  <Star size={10} fill="white" stroke="none" />
                  <span className="text-[8px] font-black tracking-[2px] uppercase">VIP Choice</span>
                </div>
              )}
              {/* ── Share button خارج الكارد ── */}
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
            <p className="text-[8px] text-white/40 uppercase tracking-[3px] font-bold">Per Day</p>
            <p className="text-lg md:text-xl font-bold text-white mt-0.5">
              {car.price} <span className="text-[10px] text-white/50 font-normal">EGP</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 active:bg-white hover:bg-white group/btn rounded-2xl px-5 py-3 border border-white/20 transition-all duration-300">
            <span className="text-[9px] font-bold uppercase tracking-[3px] text-white group-hover/btn:text-black transition-colors">View</span>
            <ChevronRight size={14} className="text-white group-hover/btn:text-black transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}