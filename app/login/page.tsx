'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin'); // لو نجح يدخلك للأدمن
    } catch (error) {
      alert("بيانات الدخول غلط يا هندسة!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleLogin} className="p-10 bg-zinc-900 rounded-3xl shadow-2xl space-y-6 w-96">
        <h1 className="text-2xl font-serif italic text-center">Luxe Admin Access</h1>
        <input 
          type="email" placeholder="Email" 
          className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full p-4 bg-black border border-zinc-800 rounded-xl focus:outline-none"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all">
          Login
        </button>
      </form>
    </div>
  );
}