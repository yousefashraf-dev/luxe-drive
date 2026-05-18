'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { signInWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error) {
      alert("بيانات الدخول غلط يا هندسة!");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/');
    } catch (error) {
      alert("فشل تسجيل الدخول بحساب Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md">
        <div className="p-10 bg-zinc-900/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/5 space-y-8">
          <div className="text-center">
            <h1 className="font-serif text-4xl italic text-white tracking-tight">ZaFah</h1>
            <p className="text-[8px] tracking-[0.7em] text-zinc-500 uppercase mt-2">Admin Access</p>
            <div className="h-[1px] w-12 bg-white/10 mx-auto mt-6" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[2px] hover:bg-gray-200 transition-all active:scale-[0.98] shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-[9px] text-zinc-500 uppercase tracking-[3px]">or</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="email" placeholder="Email"
              className="w-full p-4 bg-black/50 border border-zinc-800 rounded-2xl focus:outline-none focus:border-white/30 text-white placeholder:text-zinc-600 text-[13px] transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password" placeholder="Password"
              className="w-full p-4 bg-black/50 border border-zinc-800 rounded-2xl focus:outline-none focus:border-white/30 text-white placeholder:text-zinc-600 text-[13px] transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] text-[11px]">
              Email Login
            </button>
          </form>

          <p className="text-center text-[9px] text-zinc-600">
            <a href="/" className="hover:text-white transition-colors">← Back to Home</a>
          </p>
        </div>
      </div>
    </div>
  );
}
