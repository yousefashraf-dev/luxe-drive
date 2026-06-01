/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { ArrowLeft, Car, Eye, Edit3, X, ChevronRight, ChevronLeft, Star, Save, Flower2, Heart, Navigation, Image as ImageIcon } from 'lucide-react';
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
    <div className="bg-white rounded-[1.5rem] border border-zinc-200 shadow-sm p-4">
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
        {[t.calendar.su, t.calendar.mo, t.calendar.tu, t.calendar.we, t.calendar.th, t.calendar.fr, t.calendar.sa].map(d => <div key={d} className="text-[7px] font-black uppercase text-zinc-300 text-center">{d}</div>)}
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
              }`}>{day}</button>
          );
        })}
      </div>
      <p className="text-[9px] text-center text-red-400 mt-3">{t.addAd.fields.bookedDaysHint}</p>
    </div>
  );
}

function EditModal({ ad, onClose, onSaved }: { ad: any; onClose: () => void; onSaved: () => void }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState(ad.name || '');
  const [price, setPrice] = useState(ad.price || '');
  const [description, setDescription] = useState(ad.description || '');
  const [phone, setPhone] = useState(ad.phone || '');
  const [whatsapp, setWhatsapp] = useState(ad.whatsapp || '');
  const [location, setLocation] = useState(ad.location || '');
  const [images, setImages] = useState<string[]>(Array.isArray(ad.image) ? ad.image : ad.image ? [ad.image] : []);
  const [bookedDays, setBookedDays] = useState<number[]>(ad.bookedDays || []);
  const [driver, setDriver] = useState(ad.driver || 'without');
  const [fromLocation, setFromLocation] = useState(ad.fromLocation || '');
  const [toLocation, setToLocation] = useState(ad.toLocation || '');
  const [packageDetails, setPackageDetails] = useState(ad.packageDetails || '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number; total: number; percent: number} | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleToggleDay = (day: number) => {
    setBookedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const updateData: any = {
        name, price, description,
        phone: formatPhone(phone),
        whatsapp: whatsapp ? formatPhone(whatsapp) : '',
        location, image: images,
        updatedAt: serverTimestamp()
      };
      if (ad.category === 'car_package') {
        updateData.packageDetails = packageDetails;
        updateData.bookedDays = [];
        updateData.driver = null;
      } else if (ad.category === 'trip') {
        updateData.fromLocation = fromLocation;
        updateData.toLocation = toLocation;
        updateData.driver = null;
        updateData.bookedDays = [];
      } else {
        updateData.driver = driver;
        updateData.bookedDays = bookedDays;
      }
      await updateDoc(doc(db, "cars", ad.id), updateData);
      toast(t.myAds.saved, 'success');
      onSaved();
      onClose();
    } catch { toast(t.myAds.saveFailed, 'error'); }
    finally { setSubmitting(false); }
  };

  const isTrip = ad.category === 'trip';
  const isPackage = ad.category === 'car_package';

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full bg-white rounded-t-[2rem] md:rounded-[2rem] max-h-[92dvh] md:max-h-[90vh] max-w-2xl overflow-y-auto p-6 md:p-10 text-black" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-all">
          <X size={16} />
        </button>
        <h2 className="font-serif text-2xl italic mb-6">{t.myAds.editTitle}</h2>

        <div className="space-y-5">
          {ad.bouquetName ? (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.bouquetName}</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
            </div>
          ) : isTrip ? (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.tripName}</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.from}</label>
                  <input value={fromLocation} onChange={e => setFromLocation(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.to}</label>
                  <input value={toLocation} onChange={e => setToLocation(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
                </div>
              </div>
            </>
          ) : isPackage ? (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.packageName}</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.packageDetails}</label>
                <textarea value={packageDetails} onChange={e => setPackageDetails(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black h-32 resize-none font-mono" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.carName}</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.location}</label>
                <LocationPicker value={location} onChange={setLocation} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.steps.driver}</label>
                <div className="flex gap-2">
                  {[
                    { key: 'with', label: t.addAd.driverOptions.with },
                    { key: 'without', label: t.addAd.driverOptions.without },
                    { key: 'both', label: t.addAd.driverOptions.both },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => setDriver(opt.key)}
                      className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${
                        driver === opt.key ? 'bg-black text-white border-black' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                      }`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.price}</label>
              <input value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.phone}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.whatsapp}</label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.description}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-zinc-200 p-4 rounded-2xl outline-none focus:border-black h-24 resize-none" />
          </div>

          {!ad.bouquetName && !isTrip && !isPackage && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.bookedDays}</label>
              <CalendarPicker bookedDays={bookedDays} onToggle={handleToggleDay} />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">{t.addAd.fields.images}</label>
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
              className="hidden" id="edit-image-upload" />
            <label htmlFor="edit-image-upload"
              className="w-full py-6 border-2 border-dashed border-zinc-200 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 hover:border-black hover:text-zinc-400 transition-all flex flex-col items-center gap-3 cursor-pointer">
              {uploading && uploadProgress ? (
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  <div className="flex items-center gap-2 text-zinc-500">
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-600 rounded-full animate-spin" />
                      <span>{t.addAd.fields.imagesUploading} {uploadProgress.current} {t.addAd.fields.of} {uploadProgress.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-black rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percent}%` }} />
                  </div>
                  <span className="text-zinc-400 text-[10px]">{uploadProgress.percent}%</span>
                </div>
              ) : (
                <><ImageIcon size={24} />{images.length > 0 ? `${images.length} ${t.addAd.fields.imagesCount}` : t.addAd.fields.imagesUpload}</>
              )}
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="Uploaded preview" className="w-16 h-16 object-cover rounded-xl border" />
                    <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={submitting}
            className="w-full bg-black text-white py-5 rounded-[2rem] font-bold text-[11px] uppercase tracking-[0.3em] shadow-lg hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            <Save size={16} /> {submitting ? t.myAds.saving : t.myAds.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyAdsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [myCars, setMyCars] = useState<any[]>([]);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    startTransition(() => setNow(Date.now()));
    const id = setInterval(() => startTransition(() => setNow(Date.now())), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "cars"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const suspendedRefs: Promise<void>[] = [];
      data.forEach(ad => {
        if (ad.status !== 'active') return;
        if (!ad.expiryDate) return;
        const exp = ad.expiryDate.toDate ? ad.expiryDate.toDate() : new Date(ad.expiryDate);
        if (Date.now() > exp.getTime()) {
          suspendedRefs.push(updateDoc(doc(db, "cars", ad.id), { status: 'suspended', updatedAt: serverTimestamp() }));
        }
      });
      if (suspendedRefs.length > 0) {
        Promise.all(suspendedRefs).catch(() => {/* ignore */});
      }
      setMyCars(data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      }));
    });
    return () => unsub();
  }, [user]);

  if (authLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white font-serif italic animate-pulse text-2xl">{t.common.loading}</p>
    </div>
  );

  const daysLeft = (expiryDate: any, now: number) => {
    if (!expiryDate) return null;
    const exp = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    return Math.ceil((exp.getTime() - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-black">
      <nav className="bg-[#0a0a0a] text-white px-6 md:px-12 py-5 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => router.push('/')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <Heart size={18} className="text-[#c5a059]" />
          <p className="font-serif text-xl italic">{t.myAds.title}</p>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {myCars.length === 0 ? (
          <div className="text-center py-20">
            <Car size={48} className="mx-auto text-zinc-200 mb-6" />
            <p className="text-zinc-400 text-lg font-serif italic">{t.myAds.noAds}</p>
            <button onClick={() => router.push('/add-ad')} className="mt-6 bg-black text-white px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[3px] hover:bg-zinc-800 transition-all">
              {t.myAds.addNew}
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {myCars.map(ad => {
              const dLeft = daysLeft(ad.expiryDate, now);
              const isFlower = ad.category === 'flowers' || ad.bouquetName;
              return (
                <div key={ad.id} className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-gray-50 hover:shadow-xl transition-all duration-500">
                  <div className="flex flex-col md:flex-row gap-3 md:gap-6">
                    <div className="relative w-full md:w-48 h-32 md:h-40 rounded-xl md:rounded-[1.5rem] overflow-hidden shadow-md flex-shrink-0">
                      <img src={Array.isArray(ad.image) ? ad.image[0] : ad.image} alt={ad.name} className="w-full h-full object-cover" />
                      {ad.isVIP && (
                        <div className="absolute top-3 left-3 bg-[#D4AF37] text-white px-2 py-1 rounded-full flex items-center gap-1">
                          <Star size={10} fill="white" />
                          <span className="text-[7px] font-bold">VIP</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                        <h3 className="font-serif text-lg md:text-2xl italic">{ad.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                          ad.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-400 border border-red-100'
                        }`}>
                          {ad.status === 'active' ? t.myAds.status.active : t.myAds.status.suspended}
                        </span>
                        {isFlower && <Flower2 size={16} className="text-pink-400" />}
                {ad.category === 'trip' && <Navigation size={16} className="text-blue-400" />}
                      </div>
                      <div className="flex flex-wrap gap-2 md:gap-4 items-center text-[10px] md:text-[11px] text-zinc-500">
                        <span className="font-bold">{ad.price} EGP</span>
                        <div className="flex items-center gap-1">
                          <Eye size={13} className="text-blue-500" />
                          <span>{ad.views || 0} {t.myAds.viewCount}</span>
                        </div>
                        {ad.category === 'trip' && ad.fromLocation && ad.toLocation ? (
                          <span>🗺️ <span dir="ltr">{ad.fromLocation} → {ad.toLocation}</span></span>
                        ) : ad.location ? (
                          <span>📍 {ad.location}</span>
                        ) : null}
                        {dLeft !== null && dLeft !== undefined && (
                          <span className={dLeft <= 2 ? 'text-red-500 font-bold' : ''}>
                            {t.myAds.daysLeft} {dLeft} {t.myAds.day}
                          </span>
                        )}
                        {dLeft !== null && dLeft !== undefined && dLeft <= 2 && dLeft > 0 && (
                          <span className="text-red-500 text-[9px] font-bold bg-red-50 px-3 py-1 rounded-full">
                            {t.myAds.expiryWarning}
                          </span>
                        )}
                      </div>
                      {ad.description && (
                        <p className="text-zinc-400 text-[11px] md:text-[12px] mt-2 md:mt-3 line-clamp-2">{ad.description}</p>
                      )}
                    </div>
                    <div className="flex md:flex-col gap-2 md:gap-3 md:justify-center">
                      <button onClick={() => setEditingAd(ad)}
                        className="flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm active:scale-95">
                        <Edit3 size={12} className="md:w-[14px] md:h-[14px]" /> {t.myAds.edit}
                      </button>
                      {(ad.status !== 'active' || (dLeft !== null && dLeft <= 0)) && (
                        <a href={`https://wa.me/201095976766?text=${encodeURIComponent(t.myAds.renewMsg + ' ' + ad.name)}`} target="_blank"
                          className="flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-3 md:py-4 bg-[#25D366] text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-[#20bd5a] transition-all shadow-sm active:scale-95">
                          {t.myAds.renew}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingAd && (
        <EditModal ad={editingAd} onClose={() => setEditingAd(null)} onSaved={() => {}} />
      )}
    </main>
  );
}
