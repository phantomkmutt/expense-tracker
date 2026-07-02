import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, FileText, Wallet, Tag, RefreshCw } from 'lucide-react';

const DEFAULT_TITLES = [
  "ค่าอาหาร",
  "ซื้อขนมแมวเลีย",
  "ค่าเดินทาง",
  "เงินเดือน",
  "ช้อปปิ้ง",
  "ค่าบำรุงรักษา",
  "ความบันเทิง"
];

const DEFAULT_TAGS = [
  "#อาหาร",
  "#เดินทาง",
  "#ช้อปปิ้ง",
  "#ของใช้แมว",
  "#ความบันเทิง",
  "#สุขภาพ",
  "#รายได้พิเศษ"
];

// ฟังก์ชันวิเคราะห์ข้อความแจ้งเตือนโอนเงินจากแอปธนาคาร
const parseBankNotification = (text) => {
  if (!text) return null;
  let amount = "";
  let title = "รายการโอนเงิน";
  
  const amountMatch = text.match(/จำนวน(?:เงิน)?\s*([\d,.]+)\s*บาท/);
  if (amountMatch && amountMatch[1]) {
    amount = amountMatch[1].replace(/,/g, '');
  }
  
  const receiverMatch = text.match(/(?:ไปยังบัญชี|ถึงบัญชี)\s+(.+)/);
  if (receiverMatch && receiverMatch[1]) {
    title = `โอนไป: ${receiverMatch[1].trim()}`;
  }
  return { amount, title };
};

// ฟังก์ชันวิเคราะห์ข้อมูลโอนเงินจากข้อความ OCR สลิป/ไลน์
const extractDataFromText = (text) => {
  if (!text) return null;
  let amount = "";
  let title = "รายการโอนเงิน (OCR)";

  // หายอดเงิน (เช่น "เงินออก 450.00 บาท" หรือ "จำนวนเงิน 450 บาท")
  const amountMatch = text.match(/เงินออก\s*[-]?\s*([\d,.]+)\s*บาท/) || 
                      text.match(/จำนวน(?:เงิน)?\s*([\d,.]+)\s*บาท/) ||
                      text.match(/(?:โอนเงิน|ยอดเงิน)\s*([\d,.]+)\s*บาท/);
                      
  if (amountMatch && amountMatch[1]) {
    amount = amountMatch[1].replace(/,/g, '');
  }

  // หาชื่อผู้รับโอน (เช่น "ผู้รับโอน นาย สมชาย" หรือ "ไปยัง นาย สมชาย")
  const titleMatch = text.match(/(?:ผู้รับโอน|ไปยัง|ถึงบัญชี)\s+([^\n]+)/) ||
                     text.match(/(?:โอนไปยัง|โอนให้)\s+([^\n]+)/);
                     
  if (titleMatch && titleMatch[1]) {
    title = `สแกนโอน: ${titleMatch[1].trim()}`;
  }
  
  return { amount, title };
};

/**
 * TransactionForm Component
 * @param {Object} props
 * @param {Function} props.onAddTransaction - Callback function when a new transaction is added
 * @param {Array} props.wallets - List of active wallets
 * @param {string} props.selectedWalletId - Currently selected wallet ID ('all' or specific ID)
 * @param {Array} props.savedTitles - User's custom saved titles from Firestore
 * @param {Array} props.savedTags - User's custom saved tags from Firestore
 * @param {Function} props.onSaveCustomTitle - Callback to persist a custom title in userSettings
 * @param {Function} props.onSaveCustomTag - Callback to persist a custom tag in userSettings
 */
export default function TransactionForm({
  onAddTransaction,
  wallets = [],
  selectedWalletId,
  savedTitles = [],
  savedTags = [],
  onSaveCustomTitle,
  onSaveCustomTag,
  onDeleteCustomTag
}) {
  const mergedTitles = [...new Set([...DEFAULT_TITLES, ...savedTitles])];
  const mergedTags = [...new Set([...DEFAULT_TAGS, ...savedTags])];

  // Form states
  const [selectedTitleOpt, setSelectedTitleOpt] = useState(mergedTitles[0] || '');
  const [customTitle, setCustomTitle] = useState('');
  const [saveTitleForFuture, setSaveTitleForFuture] = useState(false);

  const [selectedTagOpt, setSelectedTagOpt] = useState(mergedTags[0] || '');
  const [customTag, setCustomTag] = useState('');
  const [saveTagForFuture, setSaveTagForFuture] = useState(false);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income'); // 'income' or 'expense'
  const [walletId, setWalletId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Function to delete tag (Logic requested by step 3)
  const handleDeleteTag = (tag) => {
    if (onDeleteCustomTag) {
      onDeleteCustomTag(tag);
    }
  };


  // OCR scanning states
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const fileInputRef = useRef(null);

  // State สำหรับการวิเคราะห์ผ่าน Gemini API
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Update selected wallet inside form when selectedWalletId changes
  useEffect(() => {
    if (selectedWalletId && selectedWalletId !== 'all') {
      setWalletId(selectedWalletId);
    } else if (wallets.length > 0) {
      setWalletId(wallets[0].id);
    }
  }, [selectedWalletId, wallets]);

  // Set default dropdown values if merged lists update
  useEffect(() => {
    if (!selectedTitleOpt && mergedTitles.length > 0) {
      setSelectedTitleOpt(mergedTitles[0]);
    }
    if (!selectedTagOpt && mergedTags.length > 0) {
      setSelectedTagOpt(mergedTags[0]);
    }
  }, [savedTitles, savedTags]);

  // Tag helper parser
  const parseTags = (text) => {
    if (!text || !text.trim()) return [];
    return text
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
  };

  // จัดการกดปุ่ม Smart Paste
  const handleSmartPaste = async () => {
    try {
      setError('');
      const text = await navigator.clipboard.readText();
      const parsed = parseBankNotification(text);
      if (parsed && (parsed.amount || parsed.title)) {
        if (parsed.title) {
          setSelectedTitleOpt('__custom__');
          setCustomTitle(parsed.title);
        }
        if (parsed.amount) {
          setAmount(parsed.amount);
        }
        // ตรวจจับคีย์เวิร์ดสำหรับการโอนเงินเพื่อตั้งค่าเป็นรายจ่ายอัตโนมัติ
        if (text.includes('โอนเงิน') || text.includes('โอนไปยัง') || text.includes('ถึงบัญชี') || text.includes('ไปยังบัญชี') || text.includes('KTB')) {
          setType('expense');
        }
      } else {
        setError('ไม่พบข้อมูลจำนวนเงินหรือผู้รับโอนจากข้อความในคลิปบอร์ดเหมียว~');
      }
    } catch (err) {
      console.error("Smart paste error:", err);
      setError('ไม่สามารถเข้าถึงคลิปบอร์ดได้ กรุณาอนุญาตสิทธิ์การวางข้อมูลของเบราว์เซอร์เหมียว~');
    }
  };

  // แปลงไฟล์รูปภาพเป็น Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // จัดการอัปโหลดและวิเคราะห์รูปภาพด้วย Gemini API
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const base64Data = await fileToBase64(file);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('ไม่พบข้อมูล Gemini API Key ในไฟล์ .env');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Analyze this Thai bank transfer slip. Extract the transfer amount (number only, remove commas) and the receiver\'s name/account. Return ONLY a valid JSON object in this exact format without markdown blocks: {"amount": "1500.00", "title": "โอนไป: ชื่อผู้รับ"}'
                  },
                  {
                    inlineData: {
                      mimeType: file.type || 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error details:', errorText);
        throw new Error(`Gemini API error! status: ${response.status}`);
      }

      const result = await response.json();
      const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('ไม่สามารถอ่านคำตอบจาก Gemini API ได้');
      }

      const parsedData = JSON.parse(textResponse.trim());
      if (parsedData && (parsedData.amount || parsedData.title)) {
        if (parsedData.title) {
          setSelectedTitleOpt('__custom__');
          setCustomTitle(parsedData.title);
        }
        if (parsedData.amount) {
          setAmount(parsedData.amount);
        }
        // ตั้งค่าประเภทเป็นรายจ่ายอัตโนมัติสำหรับการโอนเงิน
        setType('expense');
      } else {
        throw new Error('ไม่พบข้อมูลจำนวนเงินหรือผู้รับโอนจากสลิป');
      }
    } catch (err) {
      console.error("Gemini slip analysis error:", err);
      alert(err.message || 'วิเคราะห์สลิปล้มเหลว กรุณาลองใหม่อีกครั้ง');
      setError(err.message || 'วิเคราะห์สลิปล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Resolve Title
    let finalTitle = "";
    if (selectedTitleOpt === "__custom__") {
      finalTitle = customTitle.trim();
      if (!finalTitle) {
        setError('กรุณากรอกชื่อรายการที่คุณระบุเอง');
        return;
      }
      // If user chose to persist it for the future
      if (saveTitleForFuture && onSaveCustomTitle) {
        onSaveCustomTitle(finalTitle);
      }
    } else {
      finalTitle = selectedTitleOpt;
    }

    // Resolve Tags
    let finalTags = [];
    if (selectedTagOpt === "__custom__") {
      finalTags = parseTags(customTag);
      if (finalTags.length === 0) {
        setError('กรุณาระบุแท็กอย่างน้อย 1 แท็ก');
        return;
      }
      // If user chose to persist it for the future, save each tag to settings
      if (saveTagForFuture && onSaveCustomTag) {
        finalTags.forEach(tag => onSaveCustomTag(tag));
      }
    } else {
      finalTags = [selectedTagOpt];
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0');
      return;
    }

    if (!walletId) {
      setError('กรุณาเลือกกระเป๋าเงินสำหรับรายการนี้');
      return;
    }

    onAddTransaction({
      title: finalTitle,
      amount: parsedAmount,
      type,
      walletId,
      tags: finalTags,
      isRecurring,
      recurringPeriod: isRecurring ? 'monthly' : '',
      date: new Date().toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    // Reset Form Fields
    setCustomTitle('');
    setCustomTag('');
    setAmount('');
    setSaveTitleForFuture(false);
    setSaveTagForFuture(false);
    setIsRecurring(false);

    // Keep standard selections
    if (mergedTitles.length > 0) setSelectedTitleOpt(mergedTitles[0]);
    if (mergedTags.length > 0) setSelectedTagOpt(mergedTags[0]);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-xl transition-all duration-300">
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-300">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          บันทึกรายการใหม่
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/35 hover:border-emerald-450 rounded-xl transition-all duration-200 shadow-sm"
            title="อัปโหลดสลิป/ภาพหน้าจอเพื่อถอดข้อความอัตโนมัติ"
          >
            📷 สแกนรูปภาพ (Gemini)
          </button>
          <button
            type="button"
            onClick={handleSmartPaste}
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/35 hover:border-indigo-400 rounded-xl transition-all duration-200 shadow-sm"
            title="ดึงข้อมูลโอนเงินจากสลิปในคลิปบอร์ดมากรอกอัตโนมัติ"
          >
            📋 Smart Paste
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ส่วนอัปโหลดรูปสลิปโดยตรง */}
        <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            📷 อัปโหลดรูปสลิปเพื่อสแกนด้วย AI
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isAnalyzing}
            className="block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-600/20 file:text-indigo-300
              hover:file:bg-indigo-600/30 cursor-pointer"
          />
        </div>

        {/* ข้อความแจ้งเตือนขณะกำลังวิเคราะห์สลิป */}
        {isAnalyzing && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium flex items-center gap-2 animate-pulse">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>🤖 AI กำลังวิเคราะห์สลิป...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-sm font-medium animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Title Selection Dropdown */}
        <div>
          <label htmlFor="title-select" className="block text-sm font-medium text-gray-400 mb-1.5">
            ชื่อรายการ
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <select
              id="title-select"
              value={selectedTitleOpt}
              onChange={(e) => setSelectedTitleOpt(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
            >
              {mergedTitles.map((opt, idx) => (
                <option key={idx} value={opt} className="bg-[#0b0f19] text-gray-200">
                  {opt}
                </option>
              ))}
              <option value="__custom__" className="bg-[#0b0f19] text-indigo-400 font-bold">
                ✏️ ระบุชื่อรายการเอง...
              </option>
            </select>
          </div>
        </div>

        {/* Title Custom Text Input */}
        {selectedTitleOpt === "__custom__" && (
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-2.5 animate-fade-in">
            <label className="block text-xs font-semibold text-indigo-350">
              ระบุชื่อรายการ (ฟรีเท็กซ์)
            </label>
            <input
              type="text"
              required
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="เช่น ซื้อกาแฟส้ม, เติมน้ำมันรถ"
              className="block w-full px-3 py-2 bg-gray-900/80 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2 text-gray-300">
              <input
                id="save-title-checkbox"
                type="checkbox"
                checked={saveTitleForFuture}
                onChange={(e) => setSaveTitleForFuture(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 bg-gray-900/60 border-gray-850 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="save-title-checkbox" className="text-xs select-none cursor-pointer hover:text-indigo-400 font-medium transition-all">
                💾 ตั้งค่าเป็นตัวเลือกในดร็อปดาวน์สำหรับอนาคต (Save option)
              </label>
            </div>
          </div>
        )}

        {/* Wallet Selection Dropdown */}
        <div>
          <label htmlFor="wallet-select" className="block text-sm font-medium text-gray-400 mb-1.5">
            เลือกกระเป๋าเงิน
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Wallet className="h-4 w-4 text-gray-500" />
            </div>
            <select
              id="wallet-select"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
            >
              {wallets.length === 0 ? (
                <option value="" disabled>กำลังโหลดกระเป๋าเงิน...</option>
              ) : (
                wallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-[#0b0f19] text-gray-200">
                    {w.icon} {w.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Tags Selection Dropdown */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="tag-select" className="block text-sm font-medium text-gray-400">
              เลือกแท็ก / หมวดหมู่ย่อย
            </label>
            <button
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all duration-200 select-none cursor-pointer ${
                isAdminMode 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' 
                  : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              {isAdminMode ? '🔓 Admin Mode' : '🔒 Admin Mode'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="h-4 w-4 text-gray-500" />
            </div>
            <select
              id="tag-select"
              value={selectedTagOpt}
              onChange={(e) => setSelectedTagOpt(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
            >
              {mergedTags.map((opt, idx) => (
                <option key={idx} value={opt} className="bg-[#0b0f19] text-gray-200">
                  {opt}
                </option>
              ))}
              <option value="__custom__" className="bg-[#0b0f19] text-indigo-400 font-bold">
                ✏️ ระบุแท็กเอง (ฟรีเท็กซ์)...
              </option>
            </select>
          </div>

          {/* Tag Badges for Selection & Deletion */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {mergedTags.map((tag, idx) => {
              const isDefault = DEFAULT_TAGS.includes(tag);
              return (
                <span
                  key={idx}
                  onClick={() => setSelectedTagOpt(tag)}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-all duration-250 cursor-pointer select-none ${
                    selectedTagOpt === tag
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300'
                  }`}
                >
                  {tag}
                  {!isDefault && isAdminMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`ต้องการลบแท็ก "${tag}" ใช่หรือไม่เหมียว?`)) {
                          handleDeleteTag(tag);
                        }
                      }}
                      className="ml-1 text-rose-400 hover:text-rose-600 transition-colors p-0.5 hover:bg-rose-500/10 rounded"
                    >
                      ❌
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Tags Custom Text Input */}
        {selectedTagOpt === "__custom__" && (
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl space-y-2.5 animate-fade-in">
            <label className="block text-xs font-semibold text-indigo-350">
              ระบุแท็ก (แยกหลายคำด้วยช่องว่างหรือจุลภาค)
            </label>
            <input
              type="text"
              required
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="เช่น #อาหารเย็น, #ช้อปปิ้งออนไลน์"
              className="block w-full px-3 py-2 bg-gray-900/80 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2 text-gray-300">
              <input
                id="save-tag-checkbox"
                type="checkbox"
                checked={saveTagForFuture}
                onChange={(e) => setSaveTagForFuture(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 bg-gray-900/60 border-gray-850 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="save-tag-checkbox" className="text-xs select-none cursor-pointer hover:text-indigo-400 font-medium transition-all">
                💾 ตั้งค่าเป็นตัวเลือกในดร็อปดาวน์สำหรับอนาคต (Save option)
              </label>
            </div>
            <p className="text-[9px] text-gray-500">
              * ระบบจะสร้างเครื่องหมาย # นำหน้าแท็กอัตโนมัติเหมียว~
            </p>
          </div>
        )}

        {/* Checkbox for Recurring Transactions */}
        <div className="flex items-center gap-2.5 py-1 text-gray-300">
          <input
            id="recurring-checkbox"
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 bg-gray-900/60 border-gray-880 focus:ring-indigo-500 focus:ring-offset-gray-900 cursor-pointer"
          />
          <label htmlFor="recurring-checkbox" className="text-sm font-semibold select-none cursor-pointer flex items-center gap-1.5 hover:text-indigo-400 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${isRecurring ? 'animate-spin' : ''}`} />
            ตั้งเป็นรายการประจำทุกเดือน (Monthly Recurring)
          </label>
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
              className="block w-full px-3 py-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-gray-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 cursor-pointer"
            >
              <option value="income" className="bg-[#0b0f19] text-emerald-400">🟢 รายรับ (Income)</option>
              <option value="expense" className="bg-[#0b0f19] text-rose-400">🔴 รายจ่าย (Expense)</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-2 py-3 px-4 bg-indigo-650 hover:bg-indigo-550 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          บันทึกรายการ
        </button>
      </form>
    </div>
  );
}
