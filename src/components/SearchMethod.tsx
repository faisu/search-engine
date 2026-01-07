'use client';

interface SearchMethodProps {
  onMethodSelect: (method: string) => void;
  language: string;
  ward: string;
}

export default function SearchMethod({ onMethodSelect, language, ward }: SearchMethodProps) {
  const translations: { [key: string]: { heading: string; options: { id: string; label: string }[] } } = {
    '1': {
      heading: 'प्रभाग',
      options: [
        { id: '1', label: 'नावाने शोधा' },
        { id: '2', label: 'EPIC / Voter ID' },
      ],
    },
    '2': {
      heading: 'वार्ड',
      options: [
        { id: '1', label: 'नाम से खोजें' },
        { id: '2', label: 'EPIC / Voter ID' },
      ],
    },
    '3': {
      heading: 'Ward',
      options: [
        { id: '1', label: 'Search by Name' },
        { id: '2', label: 'EPIC / Voter ID' },
      ],
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      {/* Heading with Ward Number */}
      <h2 className={`text-base sm:text-lg font-heading font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 text-center tracking-tight ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
        <span className="block sm:inline">{texts.heading} {ward}</span>
        <span className="block sm:inline"> | </span>
        <span className="block sm:inline">{language === '1' ? 'शोध पद्धत निवडा' : language === '2' ? 'खोज विधि चुनें' : 'Select Search Method'}</span>
      </h2>

      {/* Search Method Options */}
      <div className="space-y-2.5">
        {texts.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onMethodSelect(option.id)}
            className="w-full flex items-center gap-2 sm:gap-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-800 text-xs sm:text-sm font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all text-left border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex-shrink-0 flex items-center justify-center shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-white">{option.id}</span>
            </div>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

