import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './Login';
import CatMascot from './components/CatMascot';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import { Sparkles, Wallet, ArrowUpCircle, ArrowDownCircle, Trash, LogOut } from 'lucide-react';

// รายชื่ออีเมลที่ได้รับอนุญาตในการเข้าใช้งานระบบ (Whitelist)
const ALLOWED_EMAILS = [
  "phantomkmutt@gmail.com", // อีเมลหลักของคุณ
  "Kukiaddumrong@gmail.com", // อีเมลที่ได้รับอนุญาตเพิ่มเติม
  // สามารถเพิ่มรายชื่ออีเมลอื่นๆ ที่ต้องการให้อนุญาตใช้งานตรงนี้ได้ครับ
];

/**
 * Main Application Component
 */
export default function App() {
  // Authentication states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load transactions from localStorage or start empty
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Track Auth state changes from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Save to localStorage when transactions state updates
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("ออกจากระบบสำเร็จ!");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error.message);
    }
  };

  // Calculate Balance statistics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Add Transaction Callback
  const handleAddTransaction = (newTx) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Delete Transaction Callback
  const handleDeleteTransaction = (id) => {
    setTransactions((prev) => prev.filter(tx => tx.id !== id));
  };

  // Clear All Transactions
  const handleClearAll = () => {
    if (window.confirm('คุณต้องการลบข้อมูลประวัติทั้งหมดใช่หรือไม่?')) {
      setTransactions([]);
    }
  };

  // Inject Seed Data to quickly show working app
  const handleLoadDemo = () => {
    const demoData = [
      {
        id: 1,
        title: 'เงินเดือนปลาทูประจำเดือน',
        amount: 32000,
        type: 'income',
        date: new Date(Date.now() - 3600000 * 24).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      {
        id: 2,
        title: 'ซื้อขนมแมวเลียพรีเมียม',
        amount: 450,
        type: 'expense',
        date: new Date(Date.now() - 3600000 * 12).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      {
        id: 3,
        title: 'รับจ้างเฝ้าบ้านระเบียงข้างห้อง',
        amount: 1200,
        type: 'income',
        date: new Date(Date.now() - 3600000 * 3).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      {
        id: 4,
        title: 'ค่าซ่อมของเล่นหนูวิ่งเวียน',
        amount: 1500,
        type: 'expense',
        date: new Date().toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ];
    setTransactions(demoData);
  };

  // Show a premium loading spinner while resolving auth state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#0b0f19] text-gray-100">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-sm font-semibold text-indigo-400 tracking-wider animate-pulse">กำลังโหลดข้อมูลเหมียว...</p>
      </div>
    );
  }

  // Redirect to Login if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // ตรวจสอบสิทธิ์อีเมลผู้เข้าใช้งาน (Whitelist Check)
  if (!ALLOWED_EMAILS.includes(user.email)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        {/* Glow Background Accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-rose-600/15 filter blur-3xl -z-10" />

        <div className="glass-panel w-full max-w-md p-8 rounded-3xl shadow-2xl border border-rose-500/25 relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
          
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-4xl animate-bounce">
              ❌
            </div>
          </div>

          <h2 className="text-2xl font-bold text-rose-400 mb-3 tracking-tight">ขออภัย คุณไม่มีสิทธิ์เข้าใช้งาน</h2>
          
          <p className="text-gray-400 text-sm mb-6 px-4 leading-relaxed">
            บัญชีผู้ใช้ (<span className="text-gray-200 font-semibold">{user.email}</span>) นี้ยังไม่ได้รับสิทธิ์ในการเข้าถึงระบบเหมียวแทร็กเกอร์ครับ
          </p>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-rose-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ (Logout)
          </button>
        </div>
      </div>
    );
  }

  // Show the Main application dashboard once authenticated
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* USER PROFILE & LOGOUT BAR */}
      <div className="glass-panel px-5 py-3 rounded-2xl mb-8 flex justify-between items-center shadow-lg animate-fade-in-up">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName} 
              className="w-9 h-9 rounded-full border border-indigo-500/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-sm">
              {user.displayName ? user.displayName.substring(0, 1).toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 font-semibold">สวัสดีเหมียว~</p>
            <h4 className="text-sm font-bold text-gray-200">{user.displayName || user.email}</h4>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-rose-500/20 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          ออกจากระบบ
        </button>
      </div>

      {/* HEADER SECTION WITH MASCOT */}
      <header className="flex flex-col items-center mb-8 text-center animate-fade-in-up">
        {/* Dynamic SVG Cat Mascot */}
        <CatMascot balance={balance} />

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          เหมียวแทร็กเกอร์ (Meow Tracker)
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-medium">
          ระบบบันทึกรายรับ-รายจ่ายที่แมวของคุณจะช่วยเฝ้ามองบัญชีเงินฝากอย่างใกล้ชิด!
        </p>
      </header>

      {/* CORE STATS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        
        {/* Card 1: Balance (Real-time updates) */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg border-l-4 border-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90">ยอดคงเหลือสุทธิ</p>
              <h3 className="text-2xl font-bold font-sans mt-2 text-white">
                ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-indigo-500/5 pointer-events-none">
            <Wallet className="w-24 h-24" />
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">รายรับรวม</p>
              <h3 className="text-2xl font-bold font-sans mt-2 text-emerald-400">
                ฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-emerald-500/5 pointer-events-none">
            <ArrowUpCircle className="w-24 h-24" />
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="glass-panel rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg border-l-4 border-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400/90">รายจ่ายรวม</p>
              <h3 className="text-2xl font-bold font-sans mt-2 text-rose-400">
                ฿{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2.5 bg-rose-500/10 rounded-xl">
              <ArrowDownCircle className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 text-rose-500/5 pointer-events-none">
            <ArrowDownCircle className="w-24 h-24" />
          </div>
        </div>

      </section>

      {/* DUAL WORKSPACE LAYOUT (FORM & LIST) */}
      <main className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Form Container (2/5 size on md+) */}
        <div className="md:col-span-2">
          <TransactionForm onAddTransaction={handleAddTransaction} />
          
          {/* Quick Actions Panel */}
          <div className="glass-panel rounded-2xl p-4 mt-4 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={handleLoadDemo}
              className="px-3.5 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:bg-indigo-500/30 font-semibold rounded-lg transition-colors duration-200 flex items-center gap-1.5"
            >
              📥 โหลดข้อมูลสาธิต
            </button>
            
            {transactions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30 font-semibold rounded-lg transition-colors duration-200 flex items-center gap-1.5"
              >
                <Trash className="w-3.5 h-3.5" />
                ล้างข้อมูลทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* List Container (3/5 size on md+) */}
        <div className="md:col-span-3">
          <TransactionList
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>

      </main>

      {/* Footer Design */}
      <footer className="mt-12 text-center text-xs text-gray-600">
        <p>© 2026 Meow Tracker App. All rights reserved. ❤️ Design and Coded for Cat Lovers.</p>
      </footer>
    </div>
  );
}
