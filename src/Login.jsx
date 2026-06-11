import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase';
import { LogIn, Sparkles } from 'lucide-react';

function Login() {
  // ฟังก์ชันสำหรับจัดการเมื่อผู้ใช้กดปุ่ม Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      console.log("ล็อกอินสำเร็จ!");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการล็อกอิน:", error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-indigo-600/20 filter blur-3xl -z-10 animate-pulse-subtle" />
      
      {/* Premium Glassmorphism Card */}
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/10 text-center relative overflow-hidden backdrop-blur-2xl">
        
        {/* Glow Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        {/* Animated Cute Cat Face Accent */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center text-4xl shadow-inner animate-float">
            🐱
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          Meow Tracker
        </h1>
        
        <p className="mb-8 text-gray-400 text-sm font-medium px-4">
          ยินดีต้อนรับสู่ระบบบันทึกรายรับ-รายจ่ายคู่ใจเหมียว กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อเก็บข้อมูลของคุณอย่างปลอดภัยบนคลาวด์
        </p>

        {/* Premium Google Login Button */}
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-950 font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-indigo-500/10 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.527a5.99 5.99 0 0 1 5.99-5.99c2.477 0 4.547 1.488 5.438 3.593l3.96-2.28A11.96 11.96 0 0 0 13.99 2 11.99 11.99 0 0 0 2 13.99A11.99 11.99 0 0 0 13.99 26c6.262 0 11.238-4.47 11.238-11.285 0-.582-.054-1.15-.152-1.702H12.24z"
            />
          </svg>
          <span className="font-semibold tracking-wide text-sm">เข้าสู่ระบบด้วย Google</span>
        </button>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <LogIn className="w-3.5 h-3.5 text-gray-600" />
          <span>ข้อมูลของคุณจะถูกเชื่อมโยงและป้องกันโดยระบบ Firebase</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
