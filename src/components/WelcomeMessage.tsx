'use client';

interface WelcomeMessageProps {
  onLanguageSelect: (language: string) => void;
}

export default function WelcomeMessage({ onLanguageSelect }: WelcomeMessageProps) {
  const languages = [
    { id: '1', label: 'मराठी', value: 'Marathi' },
    { id: '2', label: 'हिंदी', value: 'Hindi' },
    { id: '3', label: 'English', value: 'English' },
  ];

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm w-full max-w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Heading */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-heading font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 tracking-tight font-devanagari">
          मतदार शोध सेवा - अणुशक्ती नगर (१७२)
        </h2>
        
        {/* Sub-text */}
        <p className="text-xs sm:text-sm text-gray-600 font-body font-devanagari">
          तुमचा मतदार तपशील शोधण्यासाठी पुढे जा
        </p>
      </div>

      {/* Language Selection Buttons */}
      <div className="space-y-2.5">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onLanguageSelect(lang.id)}
            className="w-full flex items-center gap-2 sm:gap-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-800 text-xs sm:text-sm font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all text-left border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex-shrink-0 flex items-center justify-center shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-white">{lang.id}</span>
            </div>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

