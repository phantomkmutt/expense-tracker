import React from 'react';

/**
 * CatMascot Component
 * @param {Object} props
 * @param {number} props.balance - The current net balance (income - expense)
 * @param {number} props.budgetPercent - The percentage of budget spent this month
 */
export default function CatMascot({ balance, budgetPercent = 0 }) {
  // Determine the cat's mood state
  let mood = 'neutral'; // balance === 0
  if (balance > 0) {
    mood = 'happy';
  } else if (balance < 0) {
    mood = 'sad';
  }

  // Override mood if budget utilization exceeds 80% (Warning State)
  if (budgetPercent > 80) {
    mood = 'sad';
  }

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* SVG Container */}
      <div className="relative w-48 h-48 transition-all duration-500 ease-out transform hover:scale-105 filter drop-shadow-[0_10px_20px_rgba(99,102,241,0.25)]">
        
        {/* Glow behind the cat based on state */}
        <div className={`absolute inset-4 rounded-full filter blur-xl transition-all duration-700 opacity-40 -z-10 ${
          mood === 'happy' ? 'bg-emerald-500' :
          mood === 'sad' ? 'bg-rose-500' :
          'bg-indigo-500'
        }`} />

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="w-full h-full"
        >
          {/* EAR LEFT */}
          <path
            d="M 50 80 L 20 20 L 85 55 Z"
            fill="#312E81"
            stroke="#4F46E5"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 53 74 L 30 30 L 78 54 Z"
            fill="#EEF2F6"
            opacity={mood === 'sad' ? '0.7' : '0.9'}
            className="transition-all duration-500"
          />
          {/* Inner Ear Left Pink */}
          <path
            d="M 55 70 L 38 40 L 72 54 Z"
            fill="#F472B6"
            opacity="0.8"
          />

          {/* EAR RIGHT */}
          <path
            d="M 150 80 L 180 20 L 115 55 Z"
            fill="#312E81"
            stroke="#4F46E5"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 147 74 L 170 30 L 122 54 Z"
            fill="#EEF2F6"
            opacity={mood === 'sad' ? '0.7' : '0.9'}
            className="transition-all duration-500"
          />
          {/* Inner Ear Right Pink */}
          <path
            d="M 145 70 L 162 40 L 128 54 Z"
            fill="#F472B6"
            opacity="0.8"
          />

          {/* CAT HEAD BASE */}
          <ellipse
            cx="100"
            cy="110"
            rx="75"
            ry="60"
            fill="url(#catGradient)"
            stroke="#4F46E5"
            strokeWidth="4"
          />

          {/* Gradients definition */}
          <defs>
            <linearGradient id="catGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="happyCheek" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* CHEEKS */}
          {mood === 'happy' && (
            <>
              {/* Happy Rosy Cheeks */}
              <circle cx="50" cy="125" r="12" fill="url(#happyCheek)" className="animate-pulse" />
              <circle cx="150" cy="125" r="12" fill="url(#happyCheek)" className="animate-pulse" />
            </>
          )}
          {mood === 'neutral' && (
            <>
              <circle cx="52" cy="128" r="7" fill="#F472B6" opacity="0.3" />
              <circle cx="148" cy="128" r="7" fill="#F472B6" opacity="0.3" />
            </>
          )}

          {/* DYNAMIC EYES */}
          {mood === 'happy' && (
            <>
              {/* Curved Happy Smiling Eyes ( ^  ^ ) */}
              <path
                d="M 50 112 Q 62 100 74 112"
                fill="none"
                stroke="#34D399"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 126 112 Q 138 100 150 112"
                fill="none"
                stroke="#34D399"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </>
          )}

          {mood === 'sad' && (
            <>
              {/* Sad Downturned Eyes ( / \ ) */}
              <path
                d="M 52 105 L 70 115"
                fill="none"
                stroke="#F87171"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 148 105 L 130 115"
                fill="none"
                stroke="#F87171"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Sweating or Crying drops */}
              <path
                d="M 45 125 C 45 125 40 135 45 142 C 50 142 50 135 50 125"
                fill="#38BDF8"
                className="animate-bounce"
              />
              <path
                d="M 155 125 C 155 125 160 135 155 142 C 150 142 150 135 155 125"
                fill="#38BDF8"
                className="animate-bounce"
              />
            </>
          )}

          {mood === 'neutral' && (
            <>
              {/* Suspicious/Curious/Confused Eyes */}
              {/* Left Eye: Normal round eye with a question look */}
              <circle cx="62" cy="110" r="7" fill="#EEF2F6" />
              <circle cx="64" cy="110" r="3" fill="#0F172A" />

              {/* Right Eye: Raised, squinting slightly or larger */}
              <circle cx="138" cy="106" r="9" fill="#EEF2F6" />
              <circle cx="136" cy="106" r="4" fill="#0F172A" />
              
              {/* Confused Eyebrow */}
              <path
                d="M 128 92 Q 138 88 148 95"
                fill="none"
                stroke="#818CF8"
                strokeWidth="3"
                strokeLinecap="round"
              />
              
              {/* Question mark floating near cat */}
              <text x="160" y="70" fill="#818CF8" fontSize="24" fontWeight="bold" className="animate-bounce-slow">?</text>
            </>
          )}

          {/* CAT NOSE & WHISKERS */}
          {/* Cute pink triangle nose */}
          <polygon
            points="95,122 105,122 100,127"
            fill="#F472B6"
            stroke="#4F46E5"
            strokeWidth="1"
          />

          {/* DYNAMIC MOUTH */}
          {mood === 'happy' && (
            /* W-shaped cute cat smile */
            <path
              d="M 88 127 Q 94 135 100 128 Q 106 135 112 127"
              fill="none"
              stroke="#34D399"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {mood === 'sad' && (
            /* Downturned sad mouth */
            <path
              d="M 90 135 Q 100 128 110 135"
              fill="none"
              stroke="#F87171"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}

          {mood === 'neutral' && (
            /* Straight/wavy line showing confusion */
            <path
              d="M 92 130 Q 100 133 108 130"
              fill="none"
              stroke="#EEF2F6"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* WHISKERS */}
          {/* Left Whiskers */}
          <line x1="40" y1="120" x2="15" y2="115" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="40" y1="128" x2="12" y2="128" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
          {/* Right Whiskers */}
          <line x1="160" y1="120" x2="185" y2="115" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="128" x2="188" y2="128" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        {/* Floating sparkles for happy cat */}
        {mood === 'happy' && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute text-yellow-300 text-lg left-2 top-8 animate-bounce">✨</span>
            <span className="absolute text-yellow-300 text-lg right-2 top-8 animate-pulse">⭐</span>
            <span className="absolute text-emerald-400 text-sm right-6 bottom-4 animate-bounce-slow">💰</span>
          </div>
        )}
      </div>

      {/* Dynamic Status Text Bubble */}
      <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold tracking-wide border shadow-md transition-all duration-300 ${
        mood === 'happy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
        mood === 'sad' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
        'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
      }`}>
        {budgetPercent > 80 && 'เหมียวเตือนนะ! ใช้เงินเกิน 80% ของงบแล้วนะ!! 😱'}
        {budgetPercent <= 80 && mood === 'happy' && 'เหมียวมีความสุขจัง! เงินเหลือเฟือ 🥳'}
        {budgetPercent <= 80 && mood === 'sad' && 'เหมียวเครียดนะนั่น! เงินติดลบแล้ววว 😭'}
        {budgetPercent <= 80 && mood === 'neutral' && 'ไม่มีเงินเลยเหรอเหมียว? ลองบันทึกดูสิ 🤔'}
      </div>
    </div>
  );
}
