// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { Phone, X, ChevronRight, ChevronLeft, MessageCircle, Sparkles, Star } from 'lucide-react';
import { db } from '@/lib/firebase'; 
import { collection, getDocs , updateDoc, doc, increment } from 'firebase/firestore';
import ChatWidget from '../components/ChatWidget';

export default function Home() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const myWhatsAppNumber = "201095976766"; 

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "cars"));
           const carsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // ترتيب السيارات: الـ VIP أولاً ثم العادي
            const sortedCars = carsData.sort((a, b) => {
              const aVIP = a.isVIP ? 1 : 0;
              const bVIP = b.isVIP ? 1 : 0;
              return bVIP - aVIP; // الـ VIP بياخد ترتيب أعلى
            });

            setCars(sortedCars);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching cars: ", error);
            setLoading(false);
        }
    };
    fetchCars();
  }, []);

  const handleSelectCar = (car: any) => {
    let carImages = Array.isArray(car.image) ? car.image : car.image ? [car.image] : ['/placeholder-car.jpg'];
    setSelectedCar({ ...car, images: carImages });
    setCurrentImageIndex(0);

    const updateViews = async () => {
        try {
            const carRef = doc(db, "cars", car.id);
            await updateDoc(carRef, { views: increment(1) });
        } catch (e) { console.error(e); }
    };
    updateViews();
  };

  if (!mounted) return null;
  const headerOpacity = Math.max(0, 1 - scrollY / 500);

  return (
    <main className="relative min-h-screen bg-[#FAF9F6] text-[#1a1a1a] overflow-x-hidden font-sans">
      
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0 transition-all duration-1000 ease-out"
        style={{ 
          backgroundImage: `url('/f30-refined.jpg')`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
filter: `blur(${Math.max(0, 10 - scrollY / 40)}px) brightness(0.95)`,
          opacity: Math.min(0.25, 0.1 + scrollY / 1200)
        }}
      />

      {/* Admin Access Icon */}
      <div className="fixed top-24 right-6 z-[110] group">
        <a href="/admin" className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300">
          <span className="text-[10px] font-bold">U</span>
        </a>
      </div>

      {/* Optimized Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-md text-white px-6 md:px-12 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex-1 text-[10px] font-light tracking-[4px] uppercase">Luxe Drive</div>
        <div className="flex-1 text-center hidden md:block">
           <span className="text-[9px] tracking-[8px] font-bold uppercase opacity-80">Luxury Service</span>
        </div>
        <div className="flex-1 flex justify-end">
          <a href={`tel:+${myWhatsAppNumber}`} className="text-[8px] font-bold tracking-[2px] uppercase border border-white/20 px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all">Connect</a>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Main Header */}
        <header className="px-6 md:px-10 pt-36 md:pt-48 pb-20 max-w-7xl mx-auto transition-opacity duration-300" style={{ opacity: headerOpacity }}>
          <div className="overflow-hidden">
            <h1 className="font-serif text-6xl md:text-[9rem] font-light leading-[0.85] tracking-tight text-black">
              Elite <br /> <span className="italic ml-8 md:ml-32 text-zinc-400">Selection.</span>
            </h1>
          </div>
          <div className="mt-16 max-w-3xl ml-auto border-r-2 border-black pr-8">
            <p className="text-right font-light text-xl md:text-[2rem] text-zinc-500 leading-tight">
              نقدم تجربة استثنائية تتجاوز مجرد استئجار سيارة؛ نصمم <br /> 
              <span className="text-black font-medium italic">لحظات تليق بك وبتفاصيلك الخاصة.</span>
            </p>
          </div>
        </header>

        {/* Fleet Grid */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-32">
          {loading ? (
            <div className="col-span-full py-40 text-center font-serif text-xl italic text-zinc-300 animate-pulse tracking-widest uppercase">Fetching Excellence...</div>
          ) : (
            cars.map((car) => (
              <div key={car.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-zinc-100 flex flex-col cursor-pointer" onClick={() => handleSelectCar(car)}>
                <div className="relative h-72 overflow-hidden bg-zinc-100">
                  <img src={Array.isArray(car.image) ? car.image[0] : car.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={car.name} />
                   {car.isVIP && (
      <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3.5 py-1.5 rounded-full shadow-lg z-10 flex items-center gap-1.5 border border-yellow-500 animate-pulse">
        <Star size={10} fill="black" />
        <span className="text-[8px] font-black tracking-[1.5px] uppercase">VIP Choice</span>
      </div>
    )}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full">
                    <p className="text-[7px] font-bold tracking-[2px] uppercase text-white">Active Fleet</p>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-serif text-2xl italic text-black">{car.name}</h3>
                      <p className="text-[8px] text-zinc-400 uppercase tracking-[3px] font-bold mt-1">The Premium Class</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-black">{car.price}</p>
                      <p className="text-[8px] text-zinc-300 uppercase tracking-widest font-bold">EGP / Day</p>
                    </div>
                  </div>
                  <button className="mt-auto w-full py-4 bg-black text-white text-[9px] font-bold uppercase tracking-[4px] rounded-xl transition-all active:scale-95 group-hover:bg-zinc-800">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Modal - Silver Matte Luxury Theme */}
      {selectedCar && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 md:p-6 animate-in fade-in duration-300 backdrop-blur-md">
          <div className="relative bg-white max-w-6xl w-full max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row border border-white/20">
            
            {/* Image Section */}
            <div className="md:w-3/5 relative bg-zinc-200 h-64 md:h-auto overflow-hidden">
              <img src={selectedCar.images[currentImageIndex]} className="w-full h-full object-cover" alt="Selected Car" />
              {selectedCar.images.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + selectedCar.images.length) % selectedCar.images.length); }} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"><ChevronLeft size={24} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % selectedCar.images.length); }} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"><ChevronRight size={24} /></button>
                </div>
              )}
            </div>

            {/* Silver Matte Info Column */}
            <div className="md:w-2/5 p-8 md:p-12 flex flex-col justify-between bg-[#E5E5E5] overflow-y-auto">
              {/* Close Button with Black Circle Motion */}
              <button 
                onClick={() => setSelectedCar(null)} 
                className="absolute top-6 right-6 z-50 p-3 text-black rounded-full hover:bg-black hover:text-white hover:rotate-90 transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-sm"
              >
                <X size={18} />
              </button>
              
              <div className="space-y-8">
                <div className="text-right">
                  <h2 className="font-serif text-4xl font-light italic text-black">{selectedCar.name}</h2>
                  <div className="h-1 w-12 bg-black mt-4 ml-auto"></div>
                </div>

                <p className="text-zinc-600 text-md leading-relaxed text-right font-light italic">{selectedCar.description}</p>
                
                {/* Schedule Status Section */}
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm">
                  <p className="text-[8px] font-bold uppercase tracking-[4px] mb-6 text-center text-zinc-500">Schedule Status</p>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => {
                      const isBooked = selectedCar.bookedDays?.includes(day);
                      return (
                        <div key={day} className="flex items-center justify-center">
                          <span className={`text-[10px] w-7 h-7 flex items-center justify-center rounded-full transition-all ${isBooked ? 'bg-red-500 text-white font-bold' : 'text-zinc-400'}`}>
                            {day}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <div className="mt-10 space-y-3">
              <div className="flex gap-3">
  <a 
    href={`https://wa.me/${selectedCar.phone || myWhatsAppNumber}`} 
    target="_blank" 
    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-4 rounded-xl text-[9px] font-bold uppercase tracking-[2px] shadow-md"
  >
    <MessageCircle size={18} /> WhatsApp
  </a>
  <a 
    href={`tel:+${selectedCar.phone || myWhatsAppNumber}`} 
    className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-4 rounded-xl text-[9px] font-bold uppercase tracking-[2px] shadow-md"
  >
    <Phone size={18} /> Reserve
  </a>
</div>
                <button 
                  className="w-full py-4 border border-black/10 bg-white/20 rounded-xl text-[9px] font-bold uppercase tracking-[3px] text-zinc-600 hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                  onClick={() => setIsChatOpen(true)}
                >
                  <Sparkles size={14} /> Consult AI Assistant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-white border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[9px] text-zinc-300 uppercase tracking-[4px]">© 2026 LUXE DRIVE • EXCELLENCE DEFINED</p>
          <div className="flex items-center gap-3 group">
            <div className="h-[1px] w-8 bg-zinc-100 group-hover:w-12 transition-all duration-700"></div>
            <p className="font-serif italic text-md text-zinc-400">
              Developed by <span className="text-black font-bold ml-1">usf</span>
            </p>
          </div>
        </div>
      </footer>

      <ChatWidget isOpen={isChatOpen} setIsOpen={setIsChatOpen} contextCar={selectedCar?.name} />
    </main>
  );
}