'use client';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Search, X, ChevronLeft, MapPin, Check } from 'lucide-react';

type LocationPickerProps = {
  value: string;
  onChange: (val: string) => void;
};

const governorateEmojis: Record<string, string> = {
  'المنوفية': '🏛️',
  'الغربية': '🌾',
  'القليوبية': '🏘️',
  'الدقهلية': '🌿',
  'القاهرة': '🏙️',
  'الجيزة': '🛕',
  'الإسكندرية': '⚓',
  'الشرقية': '🌅',
  'البحيرة': '🏞️',
  'كفر الشيخ': '🕌',
  'دمياط': '⛵',
  'بورسعيد': '🚢',
  'السويس': '⚙️',
  'الإسماعيلية': '🌴',
  'بني سويف': '🌄',
  'الفيوم': '🏝️',
  'المنيا': '🏛️',
  'أسيوط': '⛰️',
  'سوهاج': '🏜️',
  'قنا': '🏗️',
  'الأقصر': '🏛️',
  'أسوان': '🏝️',
  'البحر الأحمر': '🏖️',
  'مطروح': '🏖️',
  'شمال سيناء': '🏕️',
  'جنوب سيناء': '🏔️',
  'الوادي الجديد': '🏜️',
};

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedGov, setSelectedGov] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const locs = (t as Record<string, unknown>).locations as { regions: Record<string, string[]>; governates: Record<string, string[]>; governorates: Record<string, string[]> } | undefined;
  const regions: Record<string, string[]> = locs?.regions || {};
  const governorates: Record<string, string[]> = locs?.governates || locs?.governorates || {};

  const allGovernorates = Object.keys(governorates);

  const filteredGovernorates = allGovernorates.filter(g =>
    g.includes(searchQuery) ||
    (governorates[g] || []).some((c: string) => c.includes(searchQuery))
  );

  const handleSelectGov = (gov: string) => {
    setSelectedGov(gov);
    setSearchQuery('');
  };

  const handleSelectCity = (city: string) => {
    onChange(city);
    setOpen(false);
    setSelectedGov(null);
    setSearchQuery('');
  };

  const handleBack = () => {
    setSelectedGov(null);
    setSearchQuery('');
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-all ${
          value ? 'bg-black/5 border-black/30' : 'border-zinc-200 hover:border-zinc-400'
        }`}>
        <MapPin size={18} className={value ? 'text-black' : 'text-zinc-400'} />
        <span className={value ? 'text-black font-bold text-sm' : 'text-zinc-400 text-sm'}>
          {value || t.addAd.fields.location}
        </span>
        {value && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
            className="mr-auto w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center hover:bg-zinc-300">
            <X size={12} />
          </button>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); setSelectedGov(null); setSearchQuery(''); }}}>
      <div className="relative w-full bg-white rounded-t-[2rem] md:rounded-[2rem] max-h-[85dvh] max-w-lg overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-zinc-100 shrink-0">
          {selectedGov && (
            <button type="button" onClick={handleBack} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-all">
              <ChevronLeft size={16} />
            </button>
          )}
          <p className="font-bold text-black text-base">
            {selectedGov ? selectedGov : t.locations.selectGovernorate}
          </p>
          <button type="button" onClick={() => { setOpen(false); setSelectedGov(null); setSearchQuery(''); }}
            className="mr-auto w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        {!selectedGov && (
          <div className="px-5 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text" placeholder={t.locations.search}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 py-3 pr-11 pl-4 rounded-2xl text-[12px] outline-none focus:border-black transition-all text-black placeholder:text-zinc-400"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3" style={{ WebkitOverflowScrolling: 'touch' }}>
          {!selectedGov ? (
            <>
              {/* Regions */}
              {Object.entries(regions).map(([region, govs]) => {
                const visible = govs.filter(g => filteredGovernorates.includes(g));
                if (visible.length === 0 && !searchQuery) return null;
                if (searchQuery && visible.length === 0) return null;
                return (
                  <div key={region} className="mb-4">
                    <p className="text-[9px] font-black uppercase tracking-[3px] text-zinc-400 mb-2 px-1">{region}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {visible.map(gov => (
                        <button key={gov} type="button" onClick={() => handleSelectGov(gov)}
                          className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 border border-zinc-100 transition-all text-right">
                          <span className="text-lg">{governorateEmojis[gov] || '📍'}</span>
                          <span className="text-[12px] font-bold text-black">{gov}</span>
                          <span className="mr-auto text-[9px] text-zinc-400">{governorates[gov]?.length || 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredGovernorates.length === 0 && (
                <div className="py-10 text-center">
                  <Search size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-zinc-400 text-sm">لا توجد نتائج</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[9px] font-black uppercase tracking-[3px] text-zinc-400 mb-3 px-1">{t.locations.selectCity}</p>
              <div className="grid grid-cols-2 gap-2">
                <button key={selectedGov} type="button" onClick={() => handleSelectCity(selectedGov!)}
                  className={`flex items-center gap-2 p-3.5 rounded-2xl border transition-all text-right col-span-2 ${
                    value === selectedGov
                      ? 'bg-black text-white border-black'
                      : 'bg-black/5 text-black border-black/20 hover:bg-black/10'
                  }`}>
                  <MapPin size={14} className={value === selectedGov ? 'text-white' : 'text-zinc-500'} />
                  <span className="text-[12px] font-bold">{selectedGov}</span>
                  <span className="text-[9px] text-zinc-400 mr-auto">{t.locations.selectCity} (كل المنطقة)</span>
                  {value === selectedGov && <Check size={14} className="mr-auto" />}
                </button>
                {(governorates[selectedGov] || []).map(city => (
                  <button key={city} type="button" onClick={() => handleSelectCity(city)}
                    className={`flex items-center gap-2 p-3.5 rounded-2xl border transition-all text-right ${
                      value === city
                        ? 'bg-black text-white border-black'
                        : 'bg-zinc-50 text-black border-zinc-100 hover:bg-zinc-100 hover:border-zinc-300'
                    }`}>
                    <MapPin size={14} className={value === city ? 'text-white' : 'text-zinc-400'} />
                    <span className="text-[12px] font-bold">{city}</span>
                    {value === city && <Check size={14} className="mr-auto" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
