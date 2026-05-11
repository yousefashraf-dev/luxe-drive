// @ts-nocheck
'use client';
import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Sparkles, ChevronRight } from 'lucide-react';

interface ChatWidgetProps {
  isOpen?: boolean;
  setIsOpen?: (value: boolean) => void;
  contextCar?: string; // اسم السيارة لو العميل في صفحة سيارة معينة
}

export default function ChatWidget({ isOpen: externalOpen, setIsOpen: setExternalOpen, contextCar }: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { text: "أهلاً بك في Luxe Drive! كيف يمكنني مساعدتك في اختيار سيارتك اليوم؟", isAI: true }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // عمل Session ID عشوائي لكل مستخدم عشان الميموري في n8n تشتغل صح
  const [sessionId] = useState(`session-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const sendToAI = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message;
    setChatHistory(prev => [...prev, { text: userMsg, isAI: false }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMsg, 
          currentCar: contextCar || "General Site",
          sessionId: sessionId 
        })
      });

      const data = await response.json();
      const aiResponse = data.output;

      // منطق التحويل التلقائي للواتساب إذا أعطى الـ AI إشارة بذلك
      if (aiResponse.includes("WHATSAPP_REDIRECT") || aiResponse.includes("تحويلك لواتساب")) {
        setChatHistory(prev => [...prev, { text: aiResponse.replace("WHATSAPP_REDIRECT", ""), isAI: true }]);
        setTimeout(() => {
          const waText = encodeURIComponent(`مرحباً، أريد استكمال حجز سيارة ${contextCar || ''}`);
          window.open(`https://wa.me/201234567890?text=${waText}`, '_blank');
        }, 2000);
      } else {
        setChatHistory(prev => [...prev, { text: aiResponse, isAI: true }]);
      }

    } catch (error) {
      setChatHistory(prev => [...prev, { 
        text: "حدث خطأ في الاتصال، جرب مرة أخرى أو راسلنا واتساب.", 
        isAI: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[300] font-sans text-right" dir="rtl">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all w-16 h-16 border-4 border-white flex items-center justify-center"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] h-[550px] max-h-[80vh] bg-white rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
          <div className="bg-black text-white p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Luxe Assistant</p>
              <p className="text-[10px] text-amber-400 uppercase tracking-widest">متصل الآن</p>
            </div>
            <Sparkles size={20} className="text-amber-400" />
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF9F6]">
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.isAI ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm whitespace-pre-wrap ${
                  chat.isAI ? 'bg-white text-gray-800 border border-gray-100' : 'bg-black text-white'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-[10px] text-gray-400 animate-pulse mr-2">جاري الكتابة...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
              placeholder="اسأل عن أي سيارة..." 
              className="flex-1 p-3 outline-none text-sm bg-gray-50 rounded-xl text-black"
            />
            <button onClick={sendToAI} className="bg-black text-white p-3 rounded-xl hover:bg-zinc-800 transition-colors">
              <ChevronRight size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}