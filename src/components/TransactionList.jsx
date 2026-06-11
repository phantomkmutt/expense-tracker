import React, { useState } from 'react';
import { Trash2, History, TrendingUp, TrendingDown, Eye } from 'lucide-react';

/**
 * TransactionList Component
 * @param {Object} props
 * @param {Array} props.transactions - List of transactions
 * @param {Function} props.onDeleteTransaction - Callback when user deletes a transaction
 * @param {Array} props.wallets - List of wallets to resolve wallet details
 */
export default function TransactionList({ transactions, onDeleteTransaction, wallets = [] }) {
  const [filter, setFilter] = useState('all'); // 'all', 'income', 'expense'

  // Filter transactions based on current setting
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    return true;
  });

  // Helper to find wallet name and icon
  const getWalletDetails = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? { name: wallet.name, icon: wallet.icon } : { name: 'กระเป๋าเงิน', icon: '💵' };
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl transition-all duration-300">
      
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-300">
          <History className="w-5 h-5 text-indigo-400" />
          ประวัติรายการบันทึก
        </h2>
        
        {/* Modern Filter Tabs */}
        <div className="flex bg-gray-950/80 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            ทั้งหมด ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
              filter === 'income'
                ? 'bg-emerald-600/90 text-white shadow'
                : 'text-gray-400 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            รายรับ
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
              filter === 'expense'
                ? 'bg-rose-600/90 text-white shadow'
                : 'text-gray-400 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            รายจ่าย
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-gray-800/60 rounded-xl bg-gray-900/10">
          <Eye className="w-10 h-10 text-gray-600 mb-2.5" />
          <p className="text-gray-400 font-medium">ไม่พบรายการบันทึก</p>
          <p className="text-gray-600 text-xs mt-1">ลองเพิ่มรายการใหม่ด้วยฟอร์มด้านบนเหมียว~</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {filteredTransactions.map((item) => {
            const wallet = getWalletDetails(item.walletId);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:translate-x-1 ${
                  item.type === 'income'
                    ? 'bg-emerald-950/20 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-950/30'
                    : 'bg-rose-950/20 border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-950/30'
                }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* Type Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                      item.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                    
                    {/* Wallet Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-indigo-500/15 text-indigo-300 border border-indigo-500/10 flex items-center gap-1">
                      <span>{wallet.icon}</span>
                      <span>{wallet.name}</span>
                    </span>

                    {/* Timestamp */}
                    <span className="text-gray-500 text-[10px]">{item.date}</span>
                  </div>
                  {/* Title */}
                  <h3 className="font-semibold text-gray-200 truncate">{item.title}</h3>
                </div>

                {/* Amount and Deletion Button */}
                <div className="flex items-center gap-3">
                  <span className={`font-bold font-sans text-md whitespace-nowrap ${
                    item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  
                  {/* Trash/Delete Button */}
                  <button
                    onClick={() => onDeleteTransaction(item.id)}
                    aria-label={`ลบรายการ ${item.title}`}
                    className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
