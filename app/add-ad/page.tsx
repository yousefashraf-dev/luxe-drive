// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { CldUploadWidget } from 'next-cloudinary';
import { ArrowLeft, Car, Flower2, DollarSign, Phone, MapPin, FileText, Image as ImageIcon, ChevronRight, ChevronLeft, X, User, Calendar } from 'lucide-react';

const LOCATIONS = ['المنوفية', 'القاهرة', 'الجيزة', 'طنطا', 'المنصورة', 'بنها', 'شبين الكوم', 'الإسكندرية'];

function CalendarPicker({ bookedDays, onToggle }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
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
          <ChevronRight size={14} /> السابق
        </button>
        <p className="text-[15px] font-bold text-black">{monthNames[month]} <span className="text-zinc-400">{year}</span></p>
        <button type="button" onClick={nextMonth} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-all text-[11px] font-medium text-zinc-600">
          التالي <ChevronLeft size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
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
      <p className="text-[9px] text-center text-red-400 mt-4">🔴 حدد الأيام اللي العربية فيها محجوزة</p>
    </div>
  );
}

export default function AddAdPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0: Car or Flowers
  const [type, setType] = useState<'car' | 'flowers' | null>(null);
  // Step 1 (car): wedding or rental
  const [carType, setCarType] = useState<'wedding' | 'rental' | null>(null);
  // Step 2 (car): with or without driver
  const [driver, setDriver] = useState<'with' | 'without' | null>(null);

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

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  const handleToggleDay = (day: number) => {
    setBookedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) { alert("⚠️ لازم ترفع صورة واحدة على الأقل!"); return; }
    setSubmitting(true);
    try {
      const adData = {
        name: type === 'flowers' ? bouquetName : name,
        price,
        description,
        image: images,
        phone: phone.replace(/\D/g, '').replace(/^0/, '20'),
        whatsapp: whatsapp ? whatsapp.replace(/\D/g, '').replace(/^0/, '20') : '',
        location,
        bookedDays,
        category: type === 'flowers' ? 'flowers' : carType === 'wedding' ? 'car_wedding' : 'car_rental',
        driver: type === 'flowers' ? null : driver,
        bouquetName: type === 'flowers' ? bouquetName : '',
        userId: user?.uid || '',
        userEmail: user?.email || '',
        status: 'suspended',
        views: 0,
        isVIP: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, "cars"), adData);
      alert('تم إرسال الإعلان! ✅ في انتظار مراجعة الإدارة.');
      router.push('/my-ads');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ، حاول تاني');
    } finally { setSubmitting(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-xl animate-pulse font-serif italic">Loading...</p>
    </div>
  );

  const progress = type === 'car'
    ? (carType ? (driver ? 60 : 40) : 20)
    : (type === 'flowers' ? 40 : 0);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-white/5 px-6 md:px-12 py-5 flex items-center gap-4">
        <button onClick={() => step === 0 ? router.push('/') : setStep(s => s - 1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="font-serif text-lg italic">New Listing</p>
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
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">Step 1</p>
                <h2 className="font-serif text-3xl italic mt-2">إيه اللي عاوز تنشره؟</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={() => { setType('car'); setStep(1); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all duration-300 text-center group ${
                    type === 'car' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Car size={48} className={`mx-auto mb-4 ${type === 'car' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-lg font-bold">🚗 عربية</p>
                  <p className="text-[10px] text-zinc-500 mt-2">زفه أو إيجار</p>
                </button>
                <button type="button" onClick={() => { setType('flowers'); setStep(3); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all duration-300 text-center group ${
                    type === 'flowers' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Flower2 size={48} className={`mx-auto mb-4 ${type === 'flowers' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-lg font-bold">💐 بوكيه ورد</p>
                  <p className="text-[10px] text-zinc-500 mt-2">بوكيهات العروسة</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 1 (car): Wedding or Rental */}
          {step === 1 && type === 'car' && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">Step 2</p>
                <h2 className="font-serif text-3xl italic mt-2">نوع الخدمة؟</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={() => { setCarType('wedding'); setStep(2); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all text-center group ${
                    carType === 'wedding' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <p className="text-4xl mb-3">🎊</p>
                  <p className="text-lg font-bold">زفه</p>
                  <p className="text-[10px] text-zinc-500 mt-2">سيارات الزفاف</p>
                </button>
                <button type="button" onClick={() => { setCarType('rental'); setStep(2); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all text-center group ${
                    carType === 'rental' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <p className="text-4xl mb-3">🚙</p>
                  <p className="text-lg font-bold">إيجار</p>
                  <p className="text-[10px] text-zinc-500 mt-2">تأجير يومي</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 (car): With or Without driver */}
          {step === 2 && type === 'car' && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">Step 3</p>
                <h2 className="font-serif text-3xl italic mt-2">عاوز سواق؟</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={() => { setDriver('with'); setStep(3); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all text-center group ${
                    driver === 'with' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <User size={40} className={`mx-auto mb-4 ${driver === 'with' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-lg font-bold">بسائق</p>
                  <p className="text-[10px] text-zinc-500 mt-2">مع سواق محترف</p>
                </button>
                <button type="button" onClick={() => { setDriver('without'); setStep(3); }}
                  className={`p-10 rounded-[2.5rem] border-2 transition-all text-center group ${
                    driver === 'without' ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <Car size={40} className={`mx-auto mb-4 ${driver === 'without' ? 'text-[#c5a059]' : 'text-zinc-400 group-hover:text-white'} transition-colors`} />
                  <p className="text-lg font-bold">بدون سائق</p>
                  <p className="text-[10px] text-zinc-500 mt-2">تسوق بنفسك</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details form (for both car and flowers) */}
          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[5px] uppercase text-zinc-500 font-bold">
                  Step {type === 'flowers' ? 2 : 4}
                </p>
                <h2 className="font-serif text-3xl italic mt-2">تفاصيل الإعلان</h2>
              </div>

              {type === 'flowers' ? (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">اسم البوكيه</label>
                    <input required value={bouquetName} onChange={e => setBouquetName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                      placeholder="مثلاً: بوكيه الورود الحمراء" />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">اسم العربية</label>
                    <input required value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                      placeholder="مثلاً: BMW M4 LCI" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">المدينة / المحافظة</label>
                    <div className="flex flex-wrap gap-2">
                      {LOCATIONS.map(loc => (
                        <button key={loc} type="button" onClick={() => setLocation(loc)}
                          className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${
                            location === loc ? 'bg-[#c5a059] text-black border-[#c5a059]' : 'bg-white/10 text-white/60 border-white/10 hover:border-white/30'
                          }`}>
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">السعر</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute right-4 top-4 text-zinc-500" />
                    <input required value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 text-left"
                      placeholder="5000" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">رقم الاتصال</label>
                  <div className="relative">
                    <Phone size={16} className="absolute right-4 top-4 text-zinc-500" />
                    <input required value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 text-left"
                      placeholder="010xxxxxxxx" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">واتساب (اختياري — لو مختلف عن رقم الاتصال)</label>
                <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600"
                  placeholder="010xxxxxxxx" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">الوصف</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#c5a059] transition-all text-white placeholder:text-zinc-600 h-32 resize-none"
                  placeholder="اكتب تفاصيل عن إعلانك..." />
              </div>

              {type !== 'flowers' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">الأيام المحجوزة</label>
                  <CalendarPicker bookedDays={bookedDays} onToggle={handleToggleDay} />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2 block mb-2">الصور</label>
                <CldUploadWidget uploadPreset="ml_default" onSuccess={(res) => setImages(p => [...p, res.info.secure_url])}>
                  {({ open }) => (
                    <button type="button" onClick={() => open()}
                      className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:border-white/30 hover:text-zinc-300 transition-all flex flex-col items-center gap-3">
                      <ImageIcon size={28} />
                      {images.length > 0 ? `${images.length} صور مرفوعة` : 'اضغط لرفع الصور'}
                    </button>
                  )}
                </CldUploadWidget>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {images.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                        <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-[#c5a059] text-black py-5 rounded-[2rem] font-bold text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all active:scale-[0.98] disabled:opacity-50">
                {submitting ? 'جاري الإرسال...' : 'إرسال الإعلان للمراجعة 📨'}
              </button>

              {type === 'car' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <p className="text-[11px] text-zinc-400">
                    <span className="text-[#c5a059] font-bold">{carType === 'wedding' ? '🎊 زفه' : '🚙 إيجار'}</span>
                    {' • '}
                    <span className="text-[#c5a059] font-bold">{driver === 'with' ? '👤 بسائق' : '🚗 بدون سائق'}</span>
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
