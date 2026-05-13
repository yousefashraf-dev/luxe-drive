// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import { Phone, X, ChevronRight, ChevronLeft, MessageCircle, Star, Search, ZoomIn } from 'lucide-react';
import { db } from '@/lib/firebase'; 
import { collection, getDocs, updateDoc, doc, increment } from 'firebase/firestore';

export default function Home() {
  const [cars, setCars] = useState<any[]>([]);
  const [filteredCars, setFilteredCars] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const fleetRef = useRef<HTMLDivElement>(null);
  const myWhatsAppNumber = "201095976766"; 

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cars"));
        const carsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const sortedCars = carsData.sort((a, b) => (b.isVIP ? 1 : 0) - (a.isVIP ? 1 : 0));
        setCars(sortedCars);
        setFilteredCars(sortedCars);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching cars: ", error);
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = cars.filter(car =>
        car?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
      setFilteredCars(filtered);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setFilteredCars(cars);
    }
  }, [searchQuery, cars]);

  const handleSelectCar = (car: any) => {
    let carImages = Array.isArray(car.image) ? car.image : car.image ? [car.image] : ['/placeholder-car.jpg'];
    setSelectedCar({ ...car, images: carImages });
    setCurrentImageIndex(0);
    setShowSuggestions(false);
    setIsClosing(false);

    const updateViews = async () => {
      try {
        const carRef = doc(db, "cars", car.id);
        await updateDoc(carRef, { views: increment(1) });
      } catch (e) { console.error(e); }
    };
    updateViews();
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedCar(null);
      setIsClosing(false);
    }, 300);
  };

  if (!mounted) return null;

  // blur يبدأ من 18px ويوصل لـ minimum 4px (مش بيوصل صفر أبداً)
  const blurAmount = Math.max(4, 18 - (scrollY / 500) * 14);
  const headerOpacity = Math.max(0, 1 - scrollY / 600);
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <main className="relative min-h-screen text-[#1a1a1a] overflow-x-hidden font-sans selection:bg-black selection:text-white">

      {/* ── Background: fixed, never moves ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/f30-refined.jpg"
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: `blur(${blurAmount}px)`,
            transition: 'filter 0.08s linear',
            // scale up slightly so blur edges don't show white
            transform: 'scale(1.05)',
            transformOrigin: 'center center',
          }}
        />
        {/* Dark vignette overlay — stays consistent */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Admin Access Icon */}
      <div className="fixed top-28 right-6 z-[110] group">
        <a href="/admin" className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-500 border border-white/20">
          <span className="text-[10px] font-bold">USF</span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0a] text-white px-6 md:px-12 py-5 flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex-1 text-[11px] font-black tracking-[5px] uppercase text-white">Luxe Drive</div>
        
        {/* Smart Search */}
        <div ref={searchRef} className="flex-[1.5] max-w-sm hidden md:flex flex-col relative mx-4">
          <div className="relative flex items-center w-full">
            <Search size={14} className="absolute left-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search fleet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              className="w-full bg-white/10 border border-white/10 py-2 pl-11 pr-4 rounded-full text-[11px] outline-none transition-all focus:bg-white/20 focus:border-white/30 text-white placeholder:text-zinc-500"
            />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black rounded-2xl shadow-2xl overflow-hidden z-[150] border border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-300">
              {suggestions.map((car) => (
                <div 
                  key={car.id} 
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

        <div className="flex-1 flex justify-end items-center gap-8">
          <span className="text-[9px] tracking-[6px] font-bold uppercase opacity-60 hidden lg:block text-zinc-400">Luxury Service</span>
          <a href={`tel:+${myWhatsAppNumber}`} className="text-[9px] font-bold tracking-[3px] uppercase border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-black transition-all">Connect</a>
        </div>
      </nav>

      {/* Content layer above background */}
      <div className="relative z-10">
        {/* Main Header */}
        <header className="px-6 md:px-10 pt-44 md:pt-56 pb-24 max-w-7xl mx-auto transition-opacity duration-500" style={{ opacity: headerOpacity }}>
          <div className="overflow-hidden">
            <h1 className="font-serif text-7xl md:text-[10rem] font-light leading-[0.8] tracking-tighter text-white drop-shadow-2xl">
              Elite <br /> 
              <span className="italic ml-6 md:ml-32 text-white/50">Selection.</span>
            </h1>
          </div>

          {/* ── النص العربي بخط لاكشري على الخلفية الداكنة ── */}
          <div className="mt-20 max-w-3xl ml-auto border-r-2 border-white/40 pr-10">
            <p
              className="text-right leading-tight"
              style={{ fontFamily: "'Playfair Display', 'Noto Naskh Arabic', 'Georgia', serif" }}
            >
              <span className="text-white/60 font-light text-xl md:text-[1.8rem]">
                نقدم تجربة استثنائية تتجاوز مجرد استئجار سيارة؛ نصمم
              </span>
              <br />
              <span className="text-white font-semibold italic text-2xl md:text-[2rem] drop-shadow-lg">
                لحظات تليق بك وبتفاصيلك الخاصة.
              </span>
            </p>
          </div>
        </header>

        {/* Fleet Grid */}
        <section ref={fleetRef} className="max-w-7xl mx-auto px-4 md:px-6 pb-40">

          {loading ? (
            /* Skeleton — same layout both mobile & desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/10 backdrop-blur-md animate-pulse">
                  <div className="h-56 md:h-72 bg-white/10" />
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

          ) : filteredCars.length > 0 ? (
            /* ── Single unified grid: 1 col on mobile, 2–3 on desktop ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} onClick={() => handleSelectCar(car)} />
              ))}
            </div>

          ) : (
            <div className="py-20 text-center text-white/40 font-serif italic">
              No vehicles matching your search found.
            </div>
          )}
        </section>
      </div>

      {/* ── Modal ── */}
      {selectedCar && (
        <div
          className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-3 md:p-8 backdrop-blur-md transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div
            className={`relative bg-white max-w-6xl w-full max-h-[96vh] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row border border-white/20 transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
          >
            {/* Image side */}
            <div className="md:w-3/5 relative bg-zinc-200 h-64 md:h-auto overflow-hidden flex-shrink-0">
              <img
                src={selectedCar.images[currentImageIndex]}
                className="w-full h-full object-cover transition-opacity duration-500 cursor-zoom-in"
                alt="Selected Car"
                onClick={() => setZoomedImage(selectedCar.images[currentImageIndex])}
              />
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 pointer-events-none">
                <ZoomIn size={12} />
                <span className="text-[9px] tracking-widest uppercase">اضغط للتكبير</span>
              </div>
              {selectedCar.images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-4 md:px-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + selectedCar.images.length) % selectedCar.images.length); }}
                    className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-xl rounded-full text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl"
                  ><ChevronLeft size={22} /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % selectedCar.images.length); }}
                    className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-xl rounded-full text-white flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-xl"
                  ><ChevronRight size={22} /></button>
                </div>
              )}
            </div>

            {/* Info side */}
            <div className="md:w-2/5 p-7 md:p-14 flex flex-col justify-between bg-[#F2F2F2] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              {/* Header: اسم العربية + زرار X */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 text-right pr-4">
                  <h2 className="font-serif text-4xl md:text-5xl font-light italic text-black leading-tight">
                    {selectedCar.name}
                  </h2>
                  <div className="h-[1px] w-16 bg-black mt-4 ml-auto"></div>
                  <p className="text-[9px] text-zinc-400 uppercase tracking-[4px] mt-2">Premium Class</p>
                </div>
                
                {/* X button with spin animation */}
                <button
                  onClick={handleCloseModal}
                  className="close-btn flex-shrink-0 w-11 h-11 text-black rounded-full hover:bg-black hover:text-white transition-all bg-white shadow-md flex items-center justify-center group mt-1"
                  aria-label="Close"
                >
                  <X size={18} className="transition-transform duration-500 group-hover:rotate-90" />
                </button>
              </div>

              <div className="space-y-6 mt-4">
                <p className="text-zinc-500 text-base leading-relaxed text-right font-light italic">
                  {selectedCar.description}
                </p>
                
                {/* Calendar */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-zinc-200 shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-[5px] mb-2 text-center text-zinc-400">
                    Availability Schedule
                  </p>
                  {/* Arabic note */}
                  <p className="text-[10px] text-center text-red-500 font-medium mb-5" dir="rtl">
                    🔴 الأيام الحمراء محجوزة مسبقاً
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 mb-3">
                    {daysOfWeek.map(day => (
                      <div key={day} className="text-[8px] font-black uppercase text-zinc-400 text-center">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                      const isBooked = selectedCar.bookedDays?.includes(day);
                      return (
                        <div key={day} className="flex items-center justify-center">
                          <span className={`text-[10px] w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 font-medium
                            ${isBooked 
                              ? 'bg-red-500 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                              : 'text-zinc-500 hover:bg-zinc-100'
                            }`}>
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-8 space-y-3">
                <div className="flex gap-3">
                  <a
                    href={`https://wa.me/${selectedCar.phone || myWhatsAppNumber}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2.5 bg-[#25D366] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg hover:brightness-110 transition-all active:scale-95"
                  >
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                  <a
                    href={`tel:+${selectedCar.phone || myWhatsAppNumber}`}
                    className="flex-1 flex items-center justify-center gap-2.5 bg-black text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    <Phone size={18} /> Reserve
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Zoom Lightbox ── */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all group z-10"
            onClick={() => setZoomedImage(null)}
          >
            <X size={22} className="transition-transform duration-500 group-hover:rotate-90" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed car"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none"
            style={{ animation: 'zoomIn 0.25s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-white/40 text-[10px] tracking-[4px] uppercase">اضغط خارج الصورة للإغلاق</p>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-16 bg-[#0a0a0a] border-t border-white/5 text-white">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black uppercase tracking-[6px]">Luxe Drive</p>
            <p className="text-[9px] font-bold tracking-[4px] opacity-40 uppercase">Excellence Defined</p>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 transition-all duration-700"></div>
            <p className="font-serif italic text-lg text-zinc-400">
              Developed by <span className="text-white font-bold ml-1">usf.dev</span>
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

        /* Hide scrollbar on mobile fleet */
        .overflow-x-auto::-webkit-scrollbar { display: none; }
        .overflow-x-auto { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}

/* ── Car Card Component — Floating Luxury ── */
function CarCard({ car, onClick }: { car: any; onClick?: () => void }) {
  return (
    <div
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      {/* Floating glow on hover (desktop) */}
      <div className="absolute -inset-1 rounded-[2rem] bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

      {/* Card body */}
      <div className="relative rounded-[2rem] overflow-hidden border border-white/20 backdrop-blur-md bg-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-500 group-hover:-translate-y-1 active:scale-[0.98]">

        {/* Image — taller on mobile for better visual impact */}
        <div className="relative h-[58vw] md:h-72 overflow-hidden">
          <img
            src={Array.isArray(car.image) ? car.image[0] : car.image}
            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
            alt={car.name}
            loading="lazy"
          />
          {/* Bottom gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* Badges row */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {car.isVIP ? (
              <div className="bg-white text-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                <Star size={9} fill="black" />
                <span className="text-[8px] font-black tracking-[2px] uppercase">VIP Choice</span>
              </div>
            ) : <div />}
            <div className="bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
              <span className="text-[8px] font-bold tracking-[2px] uppercase">Active Fleet</span>
            </div>
          </div>

          {/* Car name — bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <h3 className="font-serif text-2xl md:text-3xl italic text-white leading-tight drop-shadow-lg">
              {car.name}
            </h3>
            <p className="text-[8px] text-white/50 uppercase tracking-[4px] font-bold mt-1">
              Premium Class
            </p>
          </div>
        </div>

        {/* Bottom strip — price + CTA */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 bg-black/60 backdrop-blur-sm">
          <div>
            <p className="text-[8px] text-white/40 uppercase tracking-[3px] font-bold">Per Day</p>
            <p className="text-lg md:text-xl font-bold text-white mt-0.5">
              {car.price} <span className="text-[10px] text-white/50 font-normal">EGP</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 active:bg-white hover:bg-white group/btn rounded-2xl px-5 py-3 border border-white/20 transition-all duration-300">
            <span className="text-[9px] font-bold uppercase tracking-[3px] text-white group-hover/btn:text-black transition-colors">
              View
            </span>
            <ChevronRight size={14} className="text-white group-hover/btn:text-black transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}