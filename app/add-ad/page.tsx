'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { ArrowLeft, Car, Flower2, DollarSign, Phone, Image as ImageIcon, ChevronRight, ChevronLeft, User, Navigation } from 'lucide-react';
import { formatPhone } from '@/lib/utils';
import { uploadWithProgress } from '@/lib/useUpload';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/components/Toast';
import LocationPicker from '@/components/LocationPicker';



function CalendarPicker({ bookedDays, onToggle }: { bookedDays: number[]; onToggle: (day: number) => void }) {
  const { t } = useLanguage();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthNames = t.calendar.monthNames;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: firstDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  return (
    <div className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-all text-[11px] font-medium text-zinc-600">
          <ChevronRight size={14} /> {t.calendar.prev}
        </button>
        <p className="text-[15px] font-bold text-black">{monthNames[month]} <span className="text-zinc-400">{year}</span></p>
        <button type="button" onClick={nextMonth} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-all text-[11px] font-medium text-zinc-600">
          {t.calendar.next} <ChevronLeft size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {[t.calendar.su, t.calendar.mo, t.calendar.tu, t.calendar.we, t.calendar.th, t.calendar.fr, t.calendar.sa].map(d => (
          <div key={d} className="text-[7px] font-black uppercase text-zinc-300 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const isBooked = bookedDays.includes(day);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <button key={day} type="button" onClick={() => onToggle(day)}
              className={`text-[11px] w-8 h-8 flex items-center justify-center rounded-full font-medium transition-all duration-200 ${
                isBooked ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : isToday ? 'bg-black/10 text-black font-bold' : 'text-zinc-500 hover:bg-zinc-100'
              }`}>
              {day}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-center text-red-400 mt-4">{t.addAd.fields.bookedDaysHint}</p>
    </div>
  );
}

function AddAdContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const [editMode, setEditMode] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number; total: number; percent: number} | null>(null);

  // Step 0: Car, Flowers, Trip, or Package
  const [type, setType] = useState<'car' | 'flowers' | 'trip' | 'package' | null>(null);
  // Step 1 (car): wedding or rental
  const [carType, setCarType] = useState<'wedding' | 'rental' | null>(null);
  // Step 2 (car): with or without driver
  const [driver, setDriver] = useState<'with' | 'without' | 'both' | null>(null);

  // Common fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [bookedDays, setBookedDays] = useState<number[]>([]);

  // Flower-specific
  const [bouquetName, setBouquetName] = useState('');

  // Trip-specific
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  // Package-specific
  const [packageDetails, setPackageDetails] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!editId) return;
    const loadAd = async () => {
      try {
        const snap = await getDoc(doc(db, 'cars', editId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.category === 'flowers') {
            setType('flowers');
            setBouquetName(data.bouquetName || '');
          } else if (data.category === 'trip') {
            setType('trip');
            setName(data.name || '');
            setFromLocation(data.fromLocation || '');
            setToLocation(data.toLocation || '');
          } else if (data.category === 'car_package') {
            setType('package');
            setName(data.name || '');
            setPackageDetails(data.packageDetails || '');
          } else {
            setType('car');
            setCarType(data.category === 'car_wedding' ? 'wedding' : 'rental');
            setDriver(data.driver || 'without');
            setName(data.name || '');
          }
          setPrice(data.price || '');
          setPhone(data.phone || '');
          setWhatsapp(data.whatsapp || '');
          setDescription(data.description || '');
          setLocation(data.location || '');
          setImages(data.image || []);
          setBookedDays(data.bookedDays || []);
          setEditMode(true);
          setStep(3);
        }
      } catch (err) {
        console.error('Failed to load ad:', err);
        toast(t.addAd.errors.loadFailed, 'error');
      }
    };
    loadAd();
  }, [editId]);

  const handleToggleDay = (day: number) => {
    setBookedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { toast(t.addAd.errors.noImage, 'error'); return; }
    setSubmitting(true);
    try {
      const adData = {
        name: type === 'flowers' ? bouquetName : name,
        price,
        description,
        image: images,
        phone: formatPhone(phone),
        whatsapp: whatsapp ? formatPhone(whatsapp) : '',
        location,
        bookedDays: type === 'package' ? [] : bookedDays,
        category: type === 'flowers' ? 'flowers' : type === 'trip' ? 'trip' : type === 'package' ? 'car_package' : carType === 'wedding' ? 'car_wedding' : 'car_rental',
        driver: type === 'flowers' || type === 'trip' || type === 'package' ? null : driver,
        bouquetName: type === 'flowers' ? bouquetName : '',
        fromLocation: type === 'trip' ? fromLocation : '',
        toLocation: type === 'trip' ? toLocation : '',
        packageDetails: type === 'package' ? packageDetails : '',
        userId: user?.uid || '',
        userEmail: user?.email || '',
        status: 'suspended',
        views: 0,
        isVIP: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (editMode && editId) {
        const { createdAt, views, isVIP, status, userId, userEmail, ...updateFields } = adData;
        await updateDoc(doc(db, 'cars', editId), {
          ...updateFields,
          updatedAt: serverTimestamp(),
        });
        toast(t.addAd.errors.saved, 'success');
      } else {
        await addDoc(collection(db, 'cars'), adData);
        toast(t.addAd.errors.submitted, 'success');
      }

      router.push('/my-ads');
    } catch (err) {
      console.error(err);
      toast(t.addAd.errors.generic, 'error');
    } finally { setSubmitting(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-xl animate-pulse font-serif italic">{t.common.loading}</p>
    </div>
  );

  const progress = type === 'car'
    ? (carType ? (driver ? 60 : 40) : 20)
    : (type === 'flowers' ? 40 : type === 'trip' ? 40 : 0);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5 px-6 md:px-12 py-5 flex items-center gap-4">
        <button onClick={() => step === 0 ? router.push('/') : setStep(s => s - 1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="font-serif text-lg italic">{editMode ? t.addAd.editListing : t.addAd.newListing}</p>
          <div className="h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#c5a059] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6 md:px-12 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 0: Choose type */}
          {step === 0 && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">{t.addAd.steps.chooseType}</p>
                <h2 className="font-serif text-3xl italic mt-2">{t.addAd.title}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button type="button" onClick={() => { setType('car'); setStep(1); }}
                  className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 text-center group ${
                    type === 'car' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Car size={32} className={`mx-auto mb-3 ${type === 'car' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-sm md:text-base font-bold">{t.addAd.types.car}</p>
                  <p className="text-[8px] text-zinc-500 mt-1">{t.addAd.types.carSub}</p>
                </button>
                <button type="button" onClick={() => { setType('package'); setStep(3); }}
                  className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 text-center group ${
                    type === 'package' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-8 h-8 mx-auto mb-3 ${type === 'package' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`}><path d="M16.5 9.4 7.55 4.24a1 1 0 0 0-1.1 0L2 6.5M7.5 12.5l-4.24-2.44M12 12.5l-4.24-2.44M7.5 20.5V8.5"/><path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6"/><path d="M18 6V2h-4"/><path d="M14 6V2h-4"/><path d="M10 6V2H6"/></svg>
                  <p className="text-sm md:text-base font-bold">{t.addAd.types.package}</p>
                  <p className="text-[8px] text-zinc-500 mt-1">{t.addAd.types.packageSub}</p>
                </button>
                <button type="button" onClick={() => { setType('flowers'); setStep(3); }}
                  className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 text-center group ${
                    type === 'flowers' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Flower2 size={32} className={`mx-auto mb-3 ${type === 'flowers' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-sm md:text-base font-bold">{t.addAd.types.flowers}</p>
                  <p className="text-[8px] text-zinc-500 mt-1">{t.addAd.types.flowersSub}</p>
                </button>
                <button type="button" onClick={() => { setType('trip'); setStep(3); }}
                  className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all duration-300 text-center group ${
                    type === 'trip' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Navigation size={32} className={`mx-auto mb-3 ${type === 'trip' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-sm md:text-base font-bold">{t.addAd.types.trip}</p>
                  <p className="text-[8px] text-zinc-500 mt-1">{t.addAd.types.tripSub}</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 1 (car): Wedding or Rental */}
          {step === 1 && type === 'car' && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">{t.addAd.steps.serviceType}</p>
                <h2 className="font-serif text-3xl italic mt-2">{t.addAd.steps.serviceType}</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={() => { setCarType('wedding'); setStep(2); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all text-center group ${
                    carType === 'wedding' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <p className="text-4xl mb-3">🎊</p>
                  <p className="text-lg font-bold">{t.addAd.carType.wedding}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">{t.addAd.carType.weddingSub}</p>
                </button>
                <button type="button" onClick={() => { setCarType('rental'); setStep(2); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all text-center group ${
                    carType === 'rental' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <p className="text-4xl mb-3">🚙</p>
                  <p className="text-lg font-bold">{t.addAd.carType.rental}</p>
                  <p className="text-[10px] text-zinc-500 mt-2">{t.addAd.carType.rentalSub}</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 (car): With / Without / Both driver */}
          {step === 2 && type === 'car' && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">{t.addAd.steps.driver}</p>
                <h2 className="font-serif text-3xl italic mt-2">{t.addAd.steps.driver}</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button type="button" onClick={() => { setDriver('with'); setStep(3); }}
                  className={`p-6 rounded-[2rem] border-2 transition-all text-center group ${
                    driver === 'with' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <User size={28} className={`mx-auto mb-3 ${driver === 'with' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-sm font-bold">{t.addAd.driverOptions.with}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">{t.addAd.driverOptions.withSub}</p>
                </button>
                <button type="button" onClick={() => { setDriver('without'); setStep(3); }}
                  className={`p-6 rounded-[2rem] border-2 transition-all text-center group ${
                    driver === 'without' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Car size={28} className={`mx-auto mb-3 ${driver === 'without' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-sm font-bold">{t.addAd.driverOptions.without}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">{t.addAd.driverOptions.withoutSub}</p>
                </button>
                <button type="button" onClick={() => { setDriver('both'); setStep(3); }}
                  className={`p-6 rounded-[2rem] border-2 transition-all text-center group ${
                    driver === 'both' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <User size={28} className={`mx-auto mb-3 ${driver === 'both' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-sm font-bold">{t.addAd.driverOptions.both}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">{t.addAd.driverOptions.bothSub}</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details form (for both car and flowers) */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">
                  {t.addAd.steps.details}
                </p>
                <h2 className="font-serif text-3xl italic mt-2">{t.addAd.steps.details}</h2>
              </div>

              {type === 'flowers' ? (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.bouquetName}</label>
                    <input required value={bouquetName} onChange={e => setBouquetName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                      placeholder={t.addAd.fields.bouquetPlaceholder} />
                  </div>
                </div>
              ) : type === 'package' ? (
                <div className="space-y-5">
                  <div className="bg-[#c5a059]/10 border border-[#c5a059]/20 rounded-2xl p-4 text-center">
                    <p className="text-[#c5a059] text-[11px] font-bold">{t.addAd.fields.packageInfo}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.packageName}</label>
                    <input required value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                      placeholder={t.addAd.fields.packagePlaceholder} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.packageDetails}</label>
                    <textarea required value={packageDetails} onChange={e => setPackageDetails(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 h-40 resize-none font-mono text-[13px] leading-relaxed"
                      placeholder={t.addAd.fields.packageDetailsPlaceholder} />
                  </div>
                </div>
              ) : type === 'trip' ? (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.tripName}</label>
                    <input required value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                      placeholder={t.addAd.fields.tripPlaceholder} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.from}</label>
                      <input required value={fromLocation} onChange={e => setFromLocation(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                        placeholder={t.addAd.fields.fromPlaceholder} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.to}</label>
                      <input required value={toLocation} onChange={e => setToLocation(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                        placeholder={t.addAd.fields.toPlaceholder} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.carName}</label>
                    <input required value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                      placeholder={t.addAd.fields.carPlaceholder} />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.location}</label>
                    <LocationPicker value={location} onChange={setLocation} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.price}</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute right-4 top-4 text-zinc-500" />
                    <input required value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 text-left"
                      placeholder="5000" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.phone}</label>
                  <div className="relative">
                    <Phone size={16} className="absolute right-4 top-4 text-zinc-500" />
                    <input required value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 text-left"
                      placeholder="010xxxxxxxx" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.whatsapp}</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                  placeholder="010xxxxxxxx" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.description}</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 h-32 resize-none"
                  placeholder={t.addAd.fields.descriptionPlaceholder} />
              </div>

              {type === 'car' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.bookedDays}</label>
                  <CalendarPicker bookedDays={bookedDays} onToggle={handleToggleDay} />
                </div>
              )}

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">{t.addAd.fields.images}</label>
                  <input type="file" accept="image/*" multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setUploading(true);
                      setUploadProgress({ current: 0, total: files.length, percent: 0 });
                      for (let i = 0; i < files.length; i++) {
                        try {
                          const url = await uploadWithProgress(files[i], (p) => {
                            setUploadProgress({ current: i + 1, total: files.length, percent: p.percent });
                          });
                          setImages(prev => [...prev, url]);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : t.addAd.errors.generic;
                          toast(`${t.addAd.fields.uploading} ${files[i].name}: ${msg}`, 'error');
                        }
                      }
                      setUploadProgress(null);
                      setUploading(false);
                      e.target.value = '';
                    }}
                    className="hidden" id="image-upload" />
                  <label htmlFor="image-upload"
                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:border-white/30 hover:text-zinc-300 transition-all flex flex-col items-center gap-3 cursor-pointer">
                    {uploading && uploadProgress ? (
                      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin" />
                          <span>{t.addAd.fields.uploading} {t.addAd.fields.imagesUploading} {uploadProgress.current} {t.addAd.fields.of} {uploadProgress.total}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#c5a059] rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.percent}%` }} />
                        </div>
                        <span className="text-zinc-500 text-[10px]">{uploadProgress.percent}%</span>
                      </div>
                    ) : (
                      <><ImageIcon size={28} />{images.length > 0 ? `${images.length} ${t.addAd.fields.imagesCount}` : t.addAd.fields.imagesUpload}</>
                    )}
                  </label>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="Uploaded preview" className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                        <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#c5a059] text-black py-5 rounded-[2rem] font-bold text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all active:scale-[0.98] disabled:opacity-50">
                {submitting ? t.addAd.fields.submitting : editMode ? t.addAd.fields.save : t.addAd.fields.submit}
              </button>

              {type === 'car' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-[11px] text-zinc-400">
                    <span className="text-[#c5a059] font-bold">{carType === 'wedding' ? t.addAd.carType.wedding : t.addAd.carType.rental}</span>
                    {' • '}
                    <span className="text-[#c5a059] font-bold">{driver === 'with' ? t.addAd.driverOptions.with : driver === 'both' ? t.addAd.driverOptions.both : t.addAd.driverOptions.without}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

export default function AddAdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" /></div>}>
      <AddAdContent />
    </Suspense>
  );
}
