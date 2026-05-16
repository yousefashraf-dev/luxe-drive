// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { db, auth } from '@/lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { CldUploadWidget } from 'next-cloudinary';
import { 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  Eye, 
  Calendar, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Car,
  Star,
  StarOff,
  Phone
} from 'lucide-react';

export default function AdminDashboard() {
  const [cars, setCars] = useState([]);
  const [globalStats, setGlobalStats] = useState({ total_visits: 0 });
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    description: '', 
    image: [], 
    bookedDays: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false); 
  const router = useRouter();

  // 1. تأمين الصفحة والتحقق من الهوية
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthorized(true);
      } else {
        router.push('/login'); 
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // 2. ربط البيانات المباشر (Real-time Listening)
  useEffect(() => {
    if (!authorized) return; 

    // جلب قائمة السيارات مرتبة بالأحدث
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const unsubscribeCars = onSnapshot(q, (snapshot) => {
      setCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // جلب إحصائيات الموقع العامة
    const unsubscribeStats = onSnapshot(doc(db, "stats", "global"), (doc) => {
      if (doc.exists()) setGlobalStats(doc.data());
    });

    return () => { 
      unsubscribeCars(); 
      unsubscribeStats(); 
    };
  }, [authorized]);

  // 3. معالجة الإرسال (إضافة أو تعديل)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.image.length === 0) {
      alert("⚠️ يجب رفع صورة واحدة على الأقل لإتمام الإعلان!");
      return;
    }
    
    setLoading(true);

    // تحويل الأيام من نص مفصول بفواصل إلى مصفوفة أرقام
    const processedBookedDays = typeof formData.bookedDays === 'string' 
      ? formData.bookedDays.split(',')
          .map(day => parseInt(day.trim()))
          .filter(day => !isNaN(day))
      : formData.bookedDays;

    try {
     const dataToSave = {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        image: formData.image, // مصفوفة الصور
        phone: formData.phone, // <--- ضيف السطر ده هنا بالظبط
        bookedDays: processedBookedDays,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "cars", editingId), dataToSave);
        alert('تم تحديث بيانات السيارة بنجاح! ✅');
      } else {
        await addDoc(collection(db, "cars"), {
          ...dataToSave,
          views: 0,
          createdAt: serverTimestamp()
        });
        alert('تمت إضافة السيارة الجديدة للأسطول! 🚀');
      }

      // إعادة تعيين النموذج
      setFormData({ name: '', price: '', description: '', image: [], bookedDays: '' });
      setEditingId(null);
    } catch (error) {
      console.error("Error saving document:", error);
      alert('حدث خطأ أثناء الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  // 4. حذف السيارة
  const handleDelete = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه السيارة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) {
      try {
        await deleteDoc(doc(db, "cars", id));
      } catch (error) {
        alert("فشل في حذف البيانات");
      }
    }
  };
// وظيفة تمييز السيارة كـ VIP
  const toggleVIP = async (id, currentStatus) => {
    try {
      const carRef = doc(db, "cars", id);
      await updateDoc(carRef, { 
        isVIP: !currentStatus // لو هي VIP بيلغيها، ولو مش VIP بيفعلها
      });
      // مش محتاجين نعمل refresh لأنك مستخدم onSnapshot وهي بتحدث البيانات فوراً
    } catch (error) {
      console.error("Error updating VIP status:", error);
      alert("فشل في تحديث حالة التمييز");
    }
  };
  // 5. وضع التعديل
  const startEdit = (car) => {
    setEditingId(car.id);
    setFormData({
      name: car.name,
      price: car.price,
      description: car.description,
      image: Array.isArray(car.image) ? car.image : [car.image],
      bookedDays: car.bookedDays?.join(', ') || '',
      phone: car.phone || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  

  if (!authorized) {
    return (
       
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-serif italic animate-pulse tracking-[0.3em] text-2xl mb-4">
            LUXE DRIVE
          </p>
          <div className="h-[1px] w-20 bg-zinc-800 mx-auto"></div>
          <p className="text-zinc-500 text-[10px] mt-4 uppercase tracking-widest">Verifying Admin Credentials</p>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-[#FAF9F6] p-6 md:p-12 text-black font-sans" dir="rtl">
      
      {/* --- HEADER --- */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-16 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-black p-3 rounded-2xl text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic leading-none">Luxe Drive Dashboard</h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-2">Control Center & Fleet Management</p>
          </div>
        </div>
        <button 
          onClick={() => auth.signOut()} 
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-500 px-8 py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <LogOut size={16} /> تسجيل الخروج
        </button>
      </div>
<div className="p-6">
  <a 
    href="/" 
    className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[2px] hover:bg-zinc-800 transition-all duration-300 shadow-lg"
  >
    <ArrowLeft size={16} />
    العودة للرئيسية
  </a>
</div>
      <div className="max-w-7xl mx-auto">
        {/* --- STATS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
              <p className="text-[10px] uppercase tracking-[0.3em]">Fleet Size</p>
            </div>
            <h3 className="text-6xl font-light tracking-tighter text-zinc-800">
              {cars.length} 
              <span className="text-xs font-sans text-gray-300 uppercase tracking-widest ml-3">Vehicles</span>
            </h3>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* --- FORM COLUMN --- */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 sticky top-12">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-zinc-400">
                  {editingId ? 'Edit Listing' : 'Add New Car'}
                </h2>
                {editingId && (
                  <button 
                    onClick={() => {setEditingId(null); setFormData({name:'', price:'', description:'', image:[], bookedDays:''})}}
                    className="text-[9px] bg-zinc-100 px-3 py-1 rounded-full uppercase font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest mr-2 text-zinc-400">Model Name</label>
                  <div className="relative">
                    <Car className="absolute left-4 top-4 text-zinc-300" size={18} />
                    <input 
                      required className="w-full border-none p-4 pr-4 pl-12 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-black transition-all"
                      placeholder="e.g. BMW M4 LCI" value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest mr-2 text-zinc-400">Daily Price</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-4 text-zinc-300" size={18} />
                    <input 
                      required className="w-full border-none p-4 pr-4 pl-12 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-black transition-all"
                      placeholder="e.g. 5000" value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                </div>
                {/* خانة رقم التليفون الجديدة */}
<div className="space-y-2">
  <label className="text-[10px] font-bold uppercase tracking-widest mr-2 text-zinc-400">رقم تواصل الواتساب</label>
  <div className="relative">
    <Phone className="absolute left-4 top-4 text-zinc-300" size={18} />
    <input 
      required 
      className="w-full border-none p-4 pr-4 pl-12 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-black transition-all text-right"
placeholder="010xxxxxxxx :مثلاً"
     value={formData.phone || ''}
onChange={(e) => {
  let val = e.target.value.replace(/\D/g, ''); // أرقام بس
  if (val.startsWith('0')) val = '20' + val.slice(1); // 010 → 2010
  setFormData({...formData, phone: val});
}}    />
  </div>
</div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest mr-2 text-zinc-400">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 text-zinc-300" size={18} />
                    <textarea 
                      required className="w-full border-none p-4 pr-4 pl-12 rounded-2xl bg-gray-50 h-32 outline-none focus:ring-2 focus:ring-black transition-all resize-none"
                      placeholder="Vehicle features..." value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest mr-2 text-zinc-400">Booking Calendar</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-4 text-zinc-300" size={18} />
                    <input 
                      className="w-full border-none p-4 pr-4 pl-12 rounded-2xl bg-gray-50 outline-none focus:ring-2 focus:ring-black transition-all"
                      placeholder="e.g. 10, 11, 15" 
                      value={formData.bookedDays}
                      onChange={(e) => setFormData({...formData, bookedDays: e.target.value})}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mr-2 uppercase tracking-tighter">Comma separated days of the month</p>
                </div>
                
                <CldUploadWidget 
                  uploadPreset="ml_default" 
                  onSuccess={(res) => setFormData(p => ({...p, image: [...p.image, res.info.secure_url]}))}
                >
                  {({ open }) => (
                    <button 
                      type="button" 
                      onClick={() => open()} 
                      className="w-full py-6 border-2 border-dashed border-zinc-200 rounded-3xl text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:bg-gray-50 hover:border-black transition-all flex flex-col items-center gap-3"
                    >
                      <ImageIcon size={24} />
                      {formData.image.length > 0 ? `Captured ${formData.image.length} Assets` : "Upload Gallery"}
                    </button>
                  )}
                </CldUploadWidget>

                {/* Preview Gallery */}
                {formData.image.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 justify-center">
                    {formData.image.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} className="w-14 h-14 object-cover rounded-xl border-2 border-white shadow-md" />
                        <button 
                          type="button"
                          onClick={() => setFormData(p => ({...p, image: p.image.filter((_, idx) => idx !== i)}))}
                          className="absolute -top-2 -right-2 bg-black text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black text-white py-6 rounded-[2rem] font-bold text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Processing System...' : (editingId ? 'Update Information' : 'Confirm & Publish')}
                </button>
              </form>
            </div>
          </div>

          {/* --- LIST COLUMN --- */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-serif italic">Live Fleet Status</h2>
              <div className="flex gap-2">
                <span className="text-[9px] bg-green-50 text-green-600 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-green-100">Live</span>
                <span className="text-[9px] bg-zinc-100 px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-zinc-200">{cars.length} Cars</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {cars.map(car => (
                <div key={car.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                  <div className="flex items-center gap-8 w-full">
                    <div className="relative overflow-hidden rounded-[2rem] h-32 w-44 shadow-lg">
                      <img 
                        src={Array.isArray(car.image) ? car.image[0] : car.image} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      {Array.isArray(car.image) && car.image.length > 1 && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
                          <p className="text-[8px] font-bold">+{car.image.length - 1}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-serif text-3xl italic tracking-tighter mb-2 group-hover:text-zinc-600 transition-colors">
                        {car.name}
                      </h4>
                      <div className="flex flex-wrap gap-4 items-center">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                          {car.price} EGP <span className="text-[8px] opacity-40">/ Day</span>
                        </p>
                        <div className="h-4 w-[1px] bg-zinc-100"></div>
                        <div className="flex items-center gap-2">
                          <Eye size={14} className="text-blue-500" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{car.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-green-500" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{car.bookedDays?.length || 0} Days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full md:w-auto">
                     <button 
    onClick={() => toggleVIP(car.id, car.isVIP)} 
    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm ${
      car.isVIP 
        ? 'bg-yellow-400 text-black border border-yellow-500' 
        : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
    }`}
  >
    {car.isVIP ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
    {car.isVIP ? 'VIP' : 'Normal'}
  </button>
                    <button 
                      onClick={() => startEdit(car)} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-zinc-50 text-zinc-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(car.id)} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-red-50 text-red-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {cars.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-[3rem]">
                <Car size={48} className="mx-auto text-zinc-100 mb-4" />
                <p className="text-zinc-300 uppercase tracking-widest text-[10px]">No vehicles in fleet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer Decoration */}
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-zinc-100 text-center">
        <p className="text-[8px] text-zinc-300 uppercase tracking-[0.5em]">Luxe Drive Administrative Panel • v2.0</p>
      </div>
    </div>
  );
}