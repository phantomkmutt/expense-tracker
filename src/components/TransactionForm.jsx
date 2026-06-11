import React, { useState } from 'react';
import { PlusCircle, FileText, DollarSign } from 'lucide-react';

/**
 * TransactionForm Component
 * @param {Object} props
 * @param {Function} props.onAddTransaction - Callback function when a new transaction is added
 */
export default function TransactionForm({ onAddTransaction }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income'); // 'income' or 'expense'
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Form validations
    if (!title.trim()) {
      setError('กรุณากรอกชื่อรายการ');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0');
      return;
    }

    // Call callback with new transaction item
    onAddTransaction({
      id: Date.now(),
      title: title.trim(),
      amount: parsedAmount,
      type,
      date: new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    // Reset Form Fields
    setTitle('');
    setAmount('');
    setType('income');
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl transition-all duration-300">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-300">
        <PlusCircle className="w-5 h-5 text-indigo-400" />
        บันทึกรายการใหม่
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-medium animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <label htmlFor="title-input" className="block text-sm font-medium text-gray-400 mb-1.5">
            ชื่อรายการ
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น เงินเดือน, ซื้อกาแฟ, ค่าอาหาร"
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Layout for Amount & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount Input */}
          <div>
            <label htmlFor="amount-input" className="block text-sm font-medium text-gray-400 mb-1.5">
              จำนวนเงิน (บาท)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-semibold text-sm">฿</span>
              </div>
              <input
                id="amount-input"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full pl-8 pr-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Type Dropdown */}
          <div>
            <label htmlFor="type-select" className="block text-sm font-medium text-gray-400 mb-1.5">
              ประเภท
            </label>
            <select
              id="type-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
            >
              <option value="income" className="bg-[#0b0f19] text-emerald-400">🟢 รายรับ (Income)</option>
              <option value="expense" className="bg-[#0b0f19] text-rose-400">🔴 รายจ่าย (Expense)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          บันทึกรายการ
        </button>
      </form>
    </div>
  );
}
