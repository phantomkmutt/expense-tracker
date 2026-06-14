import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import Login from './Login';
import CatMascot from './components/CatMascot';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { 
  Sparkles, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash, 
  LogOut, 
  Plus, 
  FolderPlus, 
  X, 
  Layers 
} from 'lucide-react';

// รายชื่ออีเมลที่ได้รับอนุญาตในการเข้าใช้งานระบบ (Whitelist)
const ALLOWED_EMAILS = [
  "phantomkmutt@gmail.com", // อีเมลหลักของคุณ
  "kukiaddumrong@gmail.com", // อีเมลที่ได้รับอนุญาตเพิ่มเติม
];

// ชุดอิโมจิกระเป๋าเงินมาตรฐานสำหรับการสร้างกระเป๋าเงินใหม่
const WALLET_ICONS = ["💵", "💳", "🏦", "🐷", "💼", "🛒"];
const WALLET_COLORS = [
  "from-indigo-500 to-purple-600 border-indigo-500",
  "from-emerald-500 to-teal-600 border-emerald-500",
  "from-rose-500 to-pink-600 border-rose-500",
  "from-amber-500 to-orange-600 border-amber-500",
  "from-cyan-500 to-blue-600 border-cyan-500"
];

export default function App() {
  // Auth state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firestore sync state
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Selection and UI state
  const [selectedWalletId, setSelectedWalletId] = useState('all');
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  
  // Form states for creating new wallet
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletIcon, setNewWalletIcon] = useState('💵');
  const [newWalletColor, setNewWalletColor] = useState(WALLET_COLORS[0]);
  
  // Budgeting states
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  // 1. Listen for authentication changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sync wallets and transactions from Firestore once authenticated
  useEffect(() => {
    if (!user) return;

    // Listen to Wallets
    const qWallets = query(collection(db, 'wallets'), where('userId', '==', user.uid));
    const unsubWallets = onSnapshot(qWallets, (snapshot) => {
      const fetchedWallets = [];
      snapshot.forEach((doc) => {
        fetchedWallets.push({ id: doc.id, ...doc.data() });
      });

      // If user has NO wallets, create default "เงินสด" cash wallet
      if (fetchedWallets.length === 0 && !loading) {
        initializeDefaultWallet(user.uid);
      } else {
        setWallets(fetchedWallets);
      }
    });

    // Listen to Transactions
    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const fetchedTx = [];
      snapshot.forEach((doc) => {
        fetchedTx.push({ id: doc.id, ...doc.data() });
      });
      // Sort transactions by date descending
      fetchedTx.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(fetchedTx);
    });

    // Listen to User Settings (Budget)
    const unsubSettings = onSnapshot(doc(db, 'userSettings', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setMonthlyBudget(docSnap.data().monthlyBudget || 10000);
      } else {
        // Initialize settings if they don't exist
        setDoc(doc(db, 'userSettings', user.uid), {
          monthlyBudget: 10000,
          updatedAt: Date.now()
        }).catch(err => console.error("Error setting default budget:", err));
      }
    });

    return () => {
      unsubWallets();
      unsubTransactions();
      unsubSettings();
    };
  }, [user]);

  // 3. Migrate Local Storage data on first run
  useEffect(() => {
    if (!user || wallets.length === 0) return;
    
    const localData = localStorage.getItem('transactions');
    if (localData) {
      try {
        const parsedTx = JSON.parse(localData);
        if (Array.isArray(parsedTx) && parsedTx.length > 0) {
          // Find default wallet (or first available)
          const defaultWallet = wallets.find(w => w.name === 'เงินสด') || wallets[0];
          if (defaultWallet) {
            migrateLocalStorageToFirestore(user.uid, defaultWallet.id, parsedTx);
          }
        } else {
          localStorage.removeItem('transactions');
        }
      } catch (e) {
        console.error("Local storage migration error:", e);
        localStorage.removeItem('transactions');
      }
    }
  }, [user, wallets]);

  // 4. Verify and Generate Monthly Recurring Transactions
  useEffect(() => {
    if (!user || transactions.length === 0) return;

    // Filter to find active recurring templates (isRecurring is true)
    const templates = transactions.filter(t => t.isRecurring === true);
    if (templates.length === 0) return;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const generateRecurring = async () => {
      for (const template of templates) {
        const startDate = new Date(template.timestamp);
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();

        // Calculate month difference between template creation and current date
        const monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);

        // If one or more months has elapsed
        if (monthsDiff > 0) {
          for (let i = 1; i <= monthsDiff; i++) {
            const targetDate = new Date(startYear, startMonth + i, 1);
            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth();

            // Check if there is already a transaction for this template in the target month & year
            const alreadyExists = transactions.some(t => {
              const tDate = new Date(t.timestamp);
              return (
                t.title === template.title &&
                t.amount === template.amount &&
                t.walletId === template.walletId &&
                tDate.getFullYear() === targetYear &&
                tDate.getMonth() === targetMonth
              );
            });

            // If it doesn't exist, create the monthly occurrence document in Firestore
            if (!alreadyExists) {
              console.log(`Generating recurring transaction "${template.title}" for ${targetMonth + 1}/${targetYear}`);
              try {
                await addDoc(collection(db, 'transactions'), {
                  userId: user.uid,
                  walletId: template.walletId,
                  title: template.title,
                  amount: template.amount,
                  type: template.type,
                  tags: template.tags || [],
                  date: targetDate.toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  timestamp: targetDate.getTime(),
                  isRecurring: false, // The generated occurrence itself is NOT a template
                  isRecurringInstance: true, // Identify as a generated instance
                  recurringPeriod: ""
                });
              } catch (err) {
                console.error("Error generating recurring transaction:", err);
              }
            }
          }
        }
      }
    };

    generateRecurring();
  }, [user, transactions]);

  // Helper function to create default wallet
  const initializeDefaultWallet = async (uid) => {
    try {
      const defaultWalletRef = doc(db, 'wallets', `default_cash_${uid}`);
      await setDoc(defaultWalletRef, {
        userId: uid,
        name: 'เงินสด',
        icon: '💵',
        color: WALLET_COLORS[0],
        createdAt: Date.now()
      });
    } catch (err) {
      console.error("Error creating default wallet:", err);
    }
  };

  // Helper function to migrate items
  const migrateLocalStorageToFirestore = async (uid, walletId, localTx) => {
    try {
      console.log(`Migrating ${localTx.length} local items to wallet ${walletId}...`);
      const batch = writeBatch(db);
      
      localTx.forEach((tx) => {
        const docRef = doc(collection(db, 'transactions'));
        batch.set(docRef, {
          userId: uid,
          walletId: walletId,
          title: tx.title || 'รายการดั้งเดิม',
          amount: parseFloat(tx.amount) || 0,
          type: tx.type || 'expense',
          date: tx.date || new Date().toLocaleString('th-TH'),
          timestamp: tx.id || Date.now(), // Use original ID as timestamp to preserve order
          tags: [],
          isRecurring: false,
          recurringPeriod: ""
        });
      });

      await batch.commit();
      console.log("Migration complete!");
      localStorage.removeItem('transactions');
    } catch (err) {
      console.error("Migration failed:", err);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  // Create Wallet Handler
  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    try {
      await addDoc(collection(db, 'wallets'), {
        userId: user.uid,
        name: newWalletName.trim(),
        icon: newWalletIcon,
        color: newWalletColor,
        createdAt: Date.now()
      });
      setNewWalletName('');
      setShowAddWalletModal(false);
    } catch (err) {
      console.error("Error adding wallet:", err);
    }
  };

  // Delete Wallet Handler (along with its transactions)
  const handleDeleteWallet = async (walletId, walletName) => {
    if (wallets.length <= 1) {
      alert('คุณต้องมีกระเป๋าเงินเหลืออย่างน้อย 1 กระเป๋าเหมียว~');
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าจะลบกระเป๋าเงิน "${walletName}"? (ข้อมูลธุรกรรมทั้งหมดในกระเป๋านี้จะถูกลบไปด้วย)`)) {
      return;
    }

    try {
      // 1. Delete transactions belonging to this wallet
      const txToDelete = transactions.filter(t => t.walletId === walletId);
      const batch = writeBatch(db);
      txToDelete.forEach((tx) => {
        batch.delete(doc(db, 'transactions', tx.id));
      });
      await batch.commit();

      // 2. Delete the wallet doc itself
      await deleteDoc(doc(db, 'wallets', walletId));

      // 3. Fallback selection to 'all' if selected wallet was deleted
      if (selectedWalletId === walletId) {
        setSelectedWalletId('all');
      }
    } catch (err) {
      console.error("Error deleting wallet:", err);
    }
  };

  // Add Transaction Handler
  const handleAddTransaction = async (newTx) => {
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        walletId: newTx.walletId,
        title: newTx.title,
        amount: newTx.amount,
        type: newTx.type,
        date: newTx.date,
        timestamp: Date.now(),
        tags: newTx.tags || [],
        isRecurring: false,
        recurringPeriod: ""
      });
    } catch (err) {
      console.error("Error adding transaction to Firestore:", err);
    }
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error("Error deleting transaction:", err);
    }
  };

  // Clear All Transactions for the currently selected wallet view
  const handleClearAll = async () => {
    const targetTx = selectedWalletId === 'all'
      ? transactions
      : transactions.filter(t => t.walletId === selectedWalletId);

    if (targetTx.length === 0) return;

    const msg = selectedWalletId === 'all'
      ? 'คุณต้องการลบรายการธุรกรรมทั้งหมดในทุกกระเป๋าใช่หรือไม่?'
      : 'คุณต้องการลบรายการธุรกรรมทั้งหมดในกระเป๋านี้ใช่หรือไม่?';

    if (window.confirm(msg)) {
      try {
        const batch = writeBatch(db);
        targetTx.forEach((tx) => {
          batch.delete(doc(db, 'transactions', tx.id));
        });
        await batch.commit();
      } catch (err) {
        console.error("Error clearing transactions:", err);
      }
    }
  };

  // Inject Seed Data to quickly show working app on Cloud Firestore
  const handleLoadDemo = async () => {
    const defaultWallet = wallets.find(w => w.name === 'เงินสด') || wallets[0];
    if (!defaultWallet) {
      alert('ไม่พบกระเป๋าเงินสำหรับใส่ข้อมูลสาธิตเหมียว~');
      return;
    }

    const demoData = [
      {
        title: 'เงินเดือนปลาทูประจำเดือน',
        amount: 32000,
        type: 'income',
      },
      {
        title: 'ซื้อขนมแมวเลียพรีเมียม',
        amount: 450,
        type: 'expense',
      },
      {
        title: 'รับจ้างเฝ้าบ้านระเบียงข้างห้อง',
        amount: 1200,
        type: 'income',
      },
      {
        title: 'ค่าซ่อมของเล่นหนูวิ่งเวียน',
        amount: 1500,
        type: 'expense',
      }
    ];

    try {
      const batch = writeBatch(db);
      demoData.forEach((tx, idx) => {
        const docRef = doc(collection(db, 'transactions'));
        batch.set(docRef, {
          userId: user.uid,
          walletId: defaultWallet.id,
          title: tx.title,
          amount: tx.amount,
          type: tx.type,
          date: new Date(Date.now() - 3600000 * (24 - idx * 6)).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: Date.now() - 3600000 * (24 - idx * 6),
          tags: [],
          isRecurring: false,
          recurringPeriod: ""
        });
      });
      await batch.commit();
      console.log("Demo data loaded to Firestore!");
    } catch (err) {
      console.error("Error loading demo data:", err);
    }
  };

  // Update Budget Handler
  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    const parsedBudget = parseFloat(budgetInput);
    if (isNaN(parsedBudget) || parsedBudget < 0) {
      alert('กรุณากรอกงบประมาณที่ถูกต้องเหมียว~');
      return;
    }
    try {
      await setDoc(doc(db, 'userSettings', user.uid), {
        monthlyBudget: parsedBudget,
        updatedAt: Date.now()
      }, { merge: true });
      setIsEditingBudget(false);
    } catch (err) {
      console.error("Error updating budget:", err);
    }
  };

  // --- STATS & BALANCE CALCULATIONS ---
  // Filters transactions by selected wallet
  const displayTransactions = selectedWalletId === 'all'
    ? transactions
    : transactions.filter(t => t.walletId === selectedWalletId);

  const totalIncome = displayTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = displayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // คำนวณรายจ่ายเฉพาะของเดือนปัจจุบันรวมทุกกระเป๋าเงิน (ตามเงื่อนไขงบประมาณประจำเดือน)
  const totalCurrentMonthExpenses = transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = new Date(t.timestamp);
      const today = new Date();
      return tDate.getFullYear() === today.getFullYear() && 
             tDate.getMonth() === today.getMonth();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetPercent = monthlyBudget > 0 ? (totalCurrentMonthExpenses / monthlyBudget) * 100 : 0;

  // Render Loader
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

  // Render Login
  if (!user) {
    return <Login />;
  }

  // Whitelist check
  if (!ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(user.email?.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      
      {/* 1. TOP PROFILE & ACTION BAR */}
      <div className="glass-panel px-5 py-3 rounded-2xl mb-6 flex justify-between items-center shadow-lg animate-fade-in-up">
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

      {/* 2. HEADER MASCOT */}
      <header className="flex flex-col items-center mb-6 text-center animate-fade-in-up">
        <CatMascot balance={balance} budgetPercent={budgetPercent} />
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Sparkles className="w-7 h-7 text-indigo-400 animate-pulse" />
          เหมียวแทร็กเกอร์ (Meow Tracker)
        </h1>
        <p className="text-gray-400 text-sm mt-1.5 font-medium">
          คุมบัญชีของคุณได้หลายกระเป๋าพร้อมกัน (Multi-Wallet) มีแมวเฝ้าดูแลอย่างใกล้ชิด!
        </p>
      </header>

      {/* 3. MULTI-WALLET MANAGER BOARD */}
      <section className="mb-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            กระเป๋าเงินของคุณ (Wallets)
          </h2>
          <button
            onClick={() => setShowAddWalletModal(true)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 rounded-xl transition-all duration-200"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            เพิ่มกระเป๋าเงิน
          </button>
        </div>

        {/* Wallets Quick selector grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card Option: All wallets */}
          <div
            onClick={() => setSelectedWalletId('all')}
            className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
              selectedWalletId === 'all'
                ? 'bg-gradient-to-br from-indigo-650 to-indigo-950 border-indigo-400 shadow-md shadow-indigo-500/10 scale-[1.02]'
                : 'glass-panel border-white/5 hover:border-indigo-500/30 hover:scale-[1.01]'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl">🌍</span>
              <span className="text-[10px] uppercase font-bold tracking-wide text-indigo-400/90">รวมทุกกระเป๋า</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold truncate">ยอดรวมสุทธิ</p>
              <h4 className="text-base font-bold font-sans text-white mt-0.5">
                ฿{transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </div>
          </div>

          {/* User Wallets */}
          {wallets.map((w) => {
            const wTx = transactions.filter(t => t.walletId === w.id);
            const wBalance = wTx.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
            
            return (
              <div
                key={w.id}
                onClick={() => setSelectedWalletId(w.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between relative group ${
                  selectedWalletId === w.id
                    ? `bg-gradient-to-br ${w.color} shadow-lg scale-[1.02]`
                    : 'glass-panel border-white/5 hover:border-indigo-500/30 hover:scale-[1.01]'
                }`}
              >
                {/* Delete button (visible when multiple wallets exist) */}
                {wallets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWallet(w.id, w.name);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-600 text-gray-300 hover:text-white rounded-xl transition-all duration-200 shadow-sm"
                    title="ลบกระเป๋าเงินนี้"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">{w.icon}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wide text-gray-300 truncate max-w-[70px]">
                    {w.name}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold truncate">ยอดเงิน</p>
                  <h4 className={`text-base font-bold font-sans mt-0.5 ${wBalance < 0 ? 'text-rose-300' : 'text-white'}`}>
                    ฿{wBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h4>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. STATS SUMMARY (Selected Wallet View) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-fade-in-up">
        {/* Card 1: Selected Balance */}
        <div className="glass-panel rounded-2xl p-4.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-lg border-l-4 border-indigo-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90">
                ยอดคงเหลือ{selectedWalletId === 'all' ? 'รวม' : ` (${wallets.find(w => w.id === selectedWalletId)?.name || ''})`}
              </p>
              <h3 className="text-2xl font-bold font-sans mt-1.5 text-white">
                ฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Wallet className="w-4.5 h-4.5 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Card 2: Selected Income */}
        <div className="glass-panel rounded-2xl p-4.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-lg border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">รายรับ</p>
              <h3 className="text-2xl font-bold font-sans mt-1.5 text-emerald-400">
                ฿{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <ArrowUpCircle className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Card 3: Selected Expense */}
        <div className="glass-panel rounded-2xl p-4.5 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] shadow-lg border-l-4 border-rose-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-400/90">รายจ่าย</p>
              <h3 className="text-2xl font-bold font-sans mt-1.5 text-rose-400">
                ฿{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <ArrowDownCircle className="w-4.5 h-4.5 text-rose-400" />
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 BUDGETING & PROGRESS BAR BOARD */}
      <section className="glass-panel rounded-2xl p-5 mb-6 animate-fade-in-up border border-indigo-500/10">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-200">
              📊 งบประมาณรายจ่ายประจำเดือนนี้ (Budget)
            </h3>
            <div className="text-[11px] text-gray-400 mt-0.5">
              รวมรายจ่ายของเดือนนี้: ฿{totalCurrentMonthExpenses.toLocaleString()} / งบประมาณ 
              {isEditingBudget ? (
                <form onSubmit={handleUpdateBudget} className="inline-flex items-center gap-1.5 ml-1.5">
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-20 px-2 py-0.5 bg-gray-900 border border-gray-800 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder={monthlyBudget.toString()}
                    required
                  />
                  <button type="submit" className="text-[10px] bg-indigo-650 hover:bg-indigo-550 px-2 py-0.5 rounded font-bold text-white">บันทึก</button>
                  <button type="button" onClick={() => setIsEditingBudget(false)} className="text-[10px] bg-gray-850 hover:bg-gray-750 px-2 py-0.5 rounded font-bold text-gray-400">ยกเลิก</button>
                </form>
              ) : (
                <span className="ml-1 text-gray-200 font-semibold">
                  ฿{monthlyBudget.toLocaleString()}
                  <button 
                    onClick={() => {
                      setBudgetInput(monthlyBudget.toString());
                      setIsEditingBudget(true);
                    }}
                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                  >
                    [แก้ไข]
                  </button>
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className={`text-base font-bold font-sans ${
              budgetPercent > 80 ? 'text-rose-400 animate-pulse' :
              budgetPercent >= 50 ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              {budgetPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 bg-gray-900/80 rounded-full overflow-hidden border border-gray-800">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              budgetPercent > 80 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse' :
              budgetPercent >= 50 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
              'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            }`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
        {budgetPercent > 80 && (
          <p className="text-[10px] text-rose-400 font-bold mt-2 animate-pulse flex items-center gap-1">
            ⚠️ ใช้จ่ายทะลุ 80% ของงบประมาณแล้ว! กรุณาควบคุมการใช้จ่ายด้วยเหมียว~
          </p>
        )}
      </section>

      {/* 5. FORM AND LIST WORKSPACE */}
      <main className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        
        {/* Form Container */}
        <div className="md:col-span-2">
          <TransactionForm 
            onAddTransaction={handleAddTransaction} 
            wallets={wallets}
            selectedWalletId={selectedWalletId}
          />
          
          {/* Quick Actions Panel */}
          <div className="glass-panel rounded-2xl p-4 mt-4 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={handleLoadDemo}
              className="px-3.5 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:bg-indigo-500/30 font-semibold rounded-lg transition-colors duration-200 flex items-center gap-1.5"
            >
              📥 โหลดข้อมูลสาธิต
            </button>
            
            {displayTransactions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30 font-semibold rounded-lg transition-colors duration-200 flex items-center gap-1.5"
              >
                <Trash className="w-3.5 h-3.5" />
                ล้างข้อมูล
              </button>
            )}
          </div>
        </div>

        {/* List Container */}
        <div className="md:col-span-3">
          <TransactionList
            transactions={displayTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            wallets={wallets}
          />
        </div>
      </main>

      {/* 5.5 SMART ANALYTICS DASHBOARD */}
      <AnalyticsDashboard transactions={transactions} />

      {/* 6. MODAL: ADD WALLET */}
      {showAddWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                📂 สร้างกระเป๋าเงินใหม่
              </h3>
              <button 
                onClick={() => setShowAddWalletModal(false)}
                className="p-1 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              {/* Wallet Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">ชื่อกระเป๋าเงิน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เงินฝากกสิกร, บัตรเครดิต B"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Wallet Icon */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">เลือกไอคอนกระเป๋า</label>
                <div className="flex gap-2 justify-between">
                  {WALLET_ICONS.map((ico) => (
                    <button
                      key={ico}
                      type="button"
                      onClick={() => setNewWalletIcon(ico)}
                      className={`text-2xl p-2 rounded-xl border transition-all duration-200 ${
                        newWalletIcon === ico 
                          ? 'bg-indigo-600/30 border-indigo-400 scale-110' 
                          : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">เลือกโทนสีการ์ด</label>
                <div className="flex gap-2">
                  {WALLET_COLORS.map((col, idx) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewWalletColor(col)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        newWalletColor === col
                          ? 'border-white scale-110 ring-2 ring-indigo-500/30'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{
                        background: idx === 0 ? '#4F46E5' : 
                                    idx === 1 ? '#10B981' : 
                                    idx === 2 ? '#F43F5E' : 
                                    idx === 3 ? '#F59E0B' : '#06B6D4'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-indigo-650 hover:bg-indigo-550 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                สร้างกระเป๋าเงิน
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-600">
        <p>© 2026 Meow Tracker App. All rights reserved. ❤️ Design and Coded for Cat Lovers.</p>
      </footer>
    </div>
  );
}
