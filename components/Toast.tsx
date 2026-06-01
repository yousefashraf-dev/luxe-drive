'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setItems(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id: number) => setItems(prev => prev.filter(t => t.id !== id));

  const bgMap: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-zinc-800',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => remove(item.id)}
            className={`${bgMap[item.type]} text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium text-center cursor-pointer pointer-events-auto animate-in slide-in-from-top-2 duration-300`}
            style={{ animation: 'toastIn 0.3s ease-out' }}
          >
            {item.message}
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes toastIn {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
