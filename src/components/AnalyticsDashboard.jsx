import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, PieChart as PieIcon } from 'lucide-react';

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

// Curated harmonious colors for Pie Chart slices
const COLORS = [
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#D946EF', // Fuchsia
  '#EAB308', // Yellow
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
];

const OTHER_COLOR = '#64748B'; // Slate for '#อื่นๆ'

export default function AnalyticsDashboard({ transactions = [] }) {
  // 1. Overall check: No transactions at all
  if (!transactions || transactions.length === 0) {
    return (
      <section className="glass-panel rounded-2xl p-8 mb-6 border border-white/5 animate-fade-in-up">
        <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          วิเคราะห์ข้อมูลทางการเงิน (Smart Analytics)
        </h2>
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-gray-800 rounded-xl bg-gray-950/20">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-gray-400 font-semibold">ยังไม่มีข้อมูลเพียงพอสำหรับสร้างกราฟ</p>
          <p className="text-gray-600 text-xs mt-1">กรุณาบันทึกรายการรายรับหรือรายจ่ายก่อนเหมียว~</p>
        </div>
      </section>
    );
  }

  // Current month & year configuration
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // --- 2. DATA PROCESSING FOR PIE CHART (Current Month Expenses grouped by tags) ---
  const currentMonthExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const tDate = new Date(t.timestamp);
    return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
  });

  const pieDataMap = {};
  currentMonthExpenses.forEach(t => {
    const tag = (t.tags && Array.isArray(t.tags) && t.tags.length > 0) ? t.tags[0] : '#อื่นๆ';
    pieDataMap[tag] = (pieDataMap[tag] || 0) + t.amount;
  });

  const pieData = Object.keys(pieDataMap).map(tag => ({
    name: tag,
    value: pieDataMap[tag]
  })).sort((a, b) => b.value - a.value); // Sort descending

  const totalCurrentMonthExpense = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

  // --- 3. DATA PROCESSING FOR LINE CHART (Income vs Expense Monthly Trend) ---
  const monthlyMap = {};
  transactions.forEach(t => {
    const tDate = new Date(t.timestamp);
    const y = tDate.getFullYear();
    const m = tDate.getMonth();
    const sortKey = y * 12 + m;
    const label = `${THAI_MONTHS[m]} ${y}`;
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;

    if (!monthlyMap[key]) {
      monthlyMap[key] = { label, income: 0, expense: 0, sortKey };
    }

    if (t.type === 'income') {
      monthlyMap[key].income += t.amount;
    } else if (t.type === 'expense') {
      monthlyMap[key].expense += t.amount;
    }
  });

  // Sort months chronologically
  const lineData = Object.values(monthlyMap)
    .sort((a, b) => a.sortKey - b.sortKey);

  // Custom tooltips to match glassmorphic dark mode
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalCurrentMonthExpense > 0 ? ((data.value / totalCurrentMonthExpense) * 100).toFixed(1) : 0;
      return (
        <div className="bg-gray-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 shadow-xl text-xs">
          <p className="font-bold text-gray-200 mb-1">{data.name}</p>
          <p className="text-rose-400 font-semibold">ยอดจ่าย: ฿{data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-gray-400 mt-0.5">คิดเป็น: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-950/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 shadow-xl text-xs">
          <p className="font-bold text-gray-200 mb-2">{label}</p>
          {payload.map((item, index) => (
            <p key={index} className="font-semibold" style={{ color: item.color }}>
              {item.name === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)'}: ฿{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 mb-6 border border-indigo-500/10 shadow-lg animate-fade-in-up">
      <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        วิเคราะห์ข้อมูลทางการเงิน (Smart Analytics)
      </h2>

      {/* Grid container: Stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Pie Chart Card - Current Month Tag Breakdown (Col span 2 on desktop) */}
        <div className="lg:col-span-2 bg-gray-950/35 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
          <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-1.5 self-start">
            <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
            สัดส่วนรายจ่ายรายแท็ก (เดือน {THAI_MONTHS[currentMonth]})
          </h3>

          {pieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 min-h-[200px]">
              <span className="text-3xl mb-2">🍽️</span>
              <p className="text-gray-500 text-xs font-medium">ยังไม่มีข้อมูลรายจ่ายในเดือนนี้เหมียว~</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Pie Chart container */}
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => {
                        const color = entry.name === '#อื่นๆ' 
                          ? OTHER_COLOR 
                          : COLORS[index % COLORS.length];
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend to make labels legible & beautiful */}
              <div className="w-full max-h-[110px] overflow-y-auto mt-2 grid grid-cols-2 gap-2 text-[10px] pr-1">
                {pieData.map((entry, index) => {
                  const color = entry.name === '#อื่นๆ' 
                    ? OTHER_COLOR 
                    : COLORS[index % COLORS.length];
                  return (
                    <div key={index} className="flex items-center gap-1.5 bg-gray-900/30 p-1.5 rounded-lg border border-white/5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-gray-300 font-medium truncate max-w-[85px]" title={entry.name}>
                        {entry.name}
                      </span>
                      <span className="text-gray-400 ml-auto font-mono">
                        ฿{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Line Chart Card - Income vs Expense Trends (Col span 3 on desktop) */}
        <div className="lg:col-span-3 bg-gray-950/35 border border-white/5 rounded-2xl p-4 flex flex-col">
          <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            แนวโน้ม รายรับ vs รายจ่าย รายเดือน
          </h3>

          <div className="w-full h-[280px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `฿${value >= 1000 ? (value / 1000) + 'k' : value}`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconSize={10} 
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-gray-400">
                      {value === 'income' ? 'รายรับ (Income)' : 'รายจ่าย (Expense)'}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981" // Emerald
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#10B981', strokeWidth: 2, fill: '#0b0f19' }}
                  activeDot={{ r: 6 }}
                  name="income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#F43F5E" // Rose
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#F43F5E', strokeWidth: 2, fill: '#0b0f19' }}
                  activeDot={{ r: 6 }}
                  name="expense"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}
