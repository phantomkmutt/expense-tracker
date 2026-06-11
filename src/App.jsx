import React, { useState, useEffect } from 'react';
import CatMascot from './components/CatMascot';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import { Sparkles, Wallet, ArrowUpCircle, ArrowDownCircle, Trash } from 'lucide-react';

/**
 * Main Application Component
 */
export default function App() {
  // Load transactions from localStorage or start empty
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('cat_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage when state updates
  useEffect(() => {
    localStorage.setItem('cat_transactions', JSON.stringify(transactions));
  }, [transactions]);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
