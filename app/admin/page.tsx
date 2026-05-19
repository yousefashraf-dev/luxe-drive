// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/firebase'; 
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { LayoutDashboard, LogOut, Trash2, Edit3, Eye, Calendar, TrendingUp, Car, Star, Phone, CheckCircle, XCircle, Flower2, Navigation } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [cars, setCars] = useState([]);
  const [globalStats, setGlobalStats] = useState({ total_visits: 0 });
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) router.push('/login');
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const unsubCars = onSnapshot(q, (snap) => setCars(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStats = onSnapshot(doc(db, "stats", "global"), (d) => { if (d.exists()) setGlobalStats(d.data()); });
    return () => { unsubCars(); unsubStats(); };
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    if (confirm("حذف نهائي؟ لا تراجع.")) {
      try { await deleteDoc(doc(db, "cars", id)); } catch (e) { alert("فشل"); }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const updateData = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'active') {
        updateData.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      await updateDoc(doc(db, "cars", id), updateData);
    } catch (e) { alert('فشل تغيير الحالة'); }
  };

  const toggleVIP = async (id, currentStatus) => {
    try { await updateDoc(doc(db, "cars", id), { isVIP: !currentStatus }); }
    catch (e) { alert("فشل"); }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-serif italic animate-pulse tracking-[0.3em] text-2xl mb-4">LUXE DRIVE</p>
          <div className="h-[1px] w-20 bg-zinc-800 mx-auto"></div>
          <p className="text-zinc-500 text-[10px] mt-4 uppercase tracking-widest">Admin Verification</p>
        </div>
    </div>
  );
  }

  const daysLeft = (car) => {
    if (!car.expiryDate) return null;
    const exp = car.expiryDate.toDate ? car.expiryDate.toDate() : new Date(car.expiryDate);
    return Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const carAds = cars.filter(c => c.category !== 'flowers' && !c.bouquetName && c.category !== 'trip');
  const flowerAds = cars.filter(c => c.category === 'flowers' || c.bouquetName);
  const tripAds = cars.filter(c => c.category === 'trip');

  const AdCard = (car) => {
    const dLeft = daysLeft(car);
    const expiryColor = dLeft === null ? '' : dLeft > 7 ? 'text-green-600' : dLeft > 0 ? 'text-yellow-600' : 'text-red-600';
    const expiryBg = dLeft === null ? '' : dLeft > 7 ? 'bg-green-50' : dLeft > 0 ? 'bg-yellow-50' : 'bg-red-50';
    return (
    <div key={car.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
      <div className="flex items-center gap-8 w-full">
        <div className="relative overflow-hidden rounded-[2rem] h-32 w-44 shadow-lg">
          <img src={Array.isArray(car.image) ? car.image[0] : car.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          {Array.isArray(car.image) && car.image.length > 1 && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
              <p className="text-[8px] font-bold">+{car.image.length - 1}</p>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="font-serif text-3xl italic tracking-tighter group-hover:text-zinc-600 transition-colors">{car.name}</h4>
            <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
              car.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-400 border border-red-100'
            }`}>
              {car.status === 'active' ? 'منشور' : 'معلق'}
            </span>
            {car.isVIP && <span className="bg-yellow-400 text-black px-2 py-1 rounded-full text-[8px] font-bold tracking-widest">VIP</span>}
            {dLeft !== null && (
              <span className={`px-2 py-1 rounded-full text-[8px] font-bold ${expiryColor} ${expiryBg}`}>
                {dLeft > 0 ? `⏳ ${dLeft} يوم` : '🔴 منتهي'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">{car.price} EGP</p>
            <div className="h-4 w-[1px] bg-zinc-100"></div>
            <div className="flex items-center gap-1.5">
              <Eye size={12} className="text-blue-500" />
              <span className="text-[9px] font-bold text-zinc-500">{car.views || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-green-500" />
              <span className="text-[9px] font-bold text-zinc-500">{car.bookedDays?.length || 0} أيام</span>
            </div>
            {car.userEmail && <span className="text-[8px] text-zinc-400 truncate max-w-[120px]">{car.userEmail}</span>}
            {car.location && <span className="text-[8px] text-zinc-400">{car.location}</span>}
            {car.driver && <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold ${
              car.driver === 'with' ? 'bg-blue-50 text-blue-600' : car.driver === 'both' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-500'
            }`}>{car.driver === 'with' ? '👤 بسائق' : car.driver === 'both' ? '👤 سائق/بدون' : '🚗 بدون سائق'}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-3 w-full md:w-auto flex-wrap justify-center">
        <button onClick={() => toggleStatus(car.id, car.status)}
          className={`flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
            car.status === 'active' ? 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-500 hover:text-white'
          }`}>
          {car.status === 'active' ? <XCircle size={14} /> : <CheckCircle size={14} />}
          {car.status === 'active' ? 'تعليق' : 'نشر'}
        </button>
        <button onClick={() => toggleVIP(car.id, car.isVIP)}
          className={`flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
            car.isVIP ? 'bg-yellow-400 text-black' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
          }`}>
          <Star size={14} fill={car.isVIP ? 'currentColor' : 'none'} /> {car.isVIP ? 'VIP' : 'Normal'}
        </button>
        <Link href={`/add-ad?edit=${car.id}`}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-zinc-50 text-zinc-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm">
          <Edit3 size={14} /> تعديل
        </Link>
        <button onClick={() => handleDelete(car.id)}
          className="flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm">
          <Trash2 size={14} /> حذف
        </button>
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-12 text-black font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-16 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-black p-3 rounded-2xl text-white"><LayoutDashboard size={24} /></div>
          <div>
            <h1 className="text-2xl font-serif italic leading-none">Luxe Drive Dashboard</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-2">Control Center</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-500 px-8 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </div>

      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[2px] hover:bg-zinc-800 transition-all duration-300 shadow-lg">
          <ArrowLeft size={16} /> العودة للرئيسية
        </Link>
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group col-span-1 md:col-span-2">
            <div className="relative z-10">
              <div className="flex items-center gap-2 opacity-50 mb-4">
                <TrendingUp size={16} />
                <p className="text-[10px] uppercase tracking-[0.3em]">Total Platform Visits</p>
              </div>
              <h3 className="text-7xl font-light tracking-tighter">{globalStats.total_visits?.toLocaleString()}</h3>
            </div>
            <LayoutDashboard size={220} className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-zinc-400 mb-4">
              <Car size={16} />
              <p className="text-[10px] uppercase tracking-[0.3em]">Total Ads</p>
            </div>
            <h3 className="text-6xl font-light tracking-tighter text-zinc-800">
              {cars.length}
              <span className="text-xs font-sans text-gray-300 uppercase tracking-widest mr-3">Items</span>
            </h3>
          </div>
        </div>

        {/* Cars Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif italic flex items-center gap-3">
              <Car size={24} className="text-zinc-400" />
              العربيات
            </h2>
            <div className="flex gap-2">
              <span className="text-[9px] bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-blue-100">
                {carAds.filter(c => c.status === 'active').length} منشور
              </span>
              <span className="text-[9px] bg-red-50 text-red-400 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-red-100">
                {carAds.filter(c => c.status !== 'active').length} معلق
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {carAds.length > 0 ? carAds.map(AdCard) : (
              <div className="text-center py-16 border-2 border-dashed border-zinc-100 rounded-[3rem]">
                <Car size={48} className="mx-auto text-zinc-100 mb-4" />
                <p className="text-zinc-300 uppercase tracking-widest text-[10px]">No car ads yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Flowers Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif italic flex items-center gap-3">
              <Flower2 size={24} className="text-zinc-400" />
              بوكيهات الورد
            </h2>
            <div className="flex gap-2">
              <span className="text-[9px] bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-blue-100">
                {flowerAds.filter(c => c.status === 'active').length} منشور
              </span>
              <span className="text-[9px] bg-red-50 text-red-400 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-red-100">
                {flowerAds.filter(c => c.status !== 'active').length} معلق
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {flowerAds.length > 0 ? flowerAds.map(AdCard) : (
              <div className="text-center py-16 border-2 border-dashed border-zinc-100 rounded-[3rem]">
                <Flower2 size={48} className="mx-auto text-zinc-100 mb-4" />
                <p className="text-zinc-300 uppercase tracking-widest text-[10px]">No flower ads yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Trips Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif italic flex items-center gap-3">
              <Navigation size={24} className="text-zinc-400" />
              Trips
            </h2>
            <div className="flex gap-2">
              <span className="text-[9px] bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-blue-100">
                {tripAds.filter(c => c.status === 'active').length} منشور
              </span>
              <span className="text-[9px] bg-red-50 text-red-400 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-red-100">
                {tripAds.filter(c => c.status !== 'active').length} معلق
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {tripAds.length > 0 ? tripAds.map(AdCard) : (
              <div className="text-center py-16 border-2 border-dashed border-zinc-100 rounded-[3rem]">
                <Navigation size={48} className="mx-auto text-zinc-100 mb-4" />
                <p className="text-zinc-300 uppercase tracking-widest text-[10px]">No trip ads yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-zinc-100 text-center">
        <p className="text-[8px] text-zinc-300 uppercase tracking-[0.5em]">Luxe Drive Administrative Panel • v3.0</p>
      </div>
    </div>
  );
}
