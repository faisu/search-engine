'use client';

import Image from 'next/image';

interface CampaignBannerProps {
  serialNo: number;
  candidateName: string;
  candidatePhoto?: string;
  language?: string;
}

// Convert number to Marathi Devanagari numerals
const toMarathiNumerals = (num: number): string => {
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(digit => marathiDigits[parseInt(digit)]).join('');
};

export default function CampaignBanner({ serialNo, candidateName, candidatePhoto, language = '1' }: CampaignBannerProps) {
  const marathiSerialNo = toMarathiNumerals(serialNo);
  
  const translations: { [key: string]: { instruction: string; dateTime: string } } = {
    '1': {
      instruction: 'घड्याळ चिन्हाच्या बटणाला मतदान करुन त्यांना प्रचंड बहुमताने विजयी करा',
      dateTime: 'मतदान दिनांक: गुरुवार, 15 जानेवारी 2026 वेळ: सकाळी 7.00 ते सायंकाळी 5.30 पर्यंत',
    },
    '2': {
      instruction: 'घड्याल चिन्ह के बटन पर वोट डालें और उन्हें बहुमत से विजयी करें',
      dateTime: 'मतदान दिनांक: गुरुवार, 15 जनवरी 2026 समय: सुबह 7.00 से शाम 5.30 तक',
    },
    '3': {
      instruction: 'Vote for the button with the clock symbol and make them victorious with a huge majority',
      dateTime: 'Voting Date: Thursday, 15 January 2026 Time: 7:00 AM to 5:30 PM',
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 bg-white rounded-2xl shadow-xl border-2 border-pink-300 p-4 sm:p-5 md:p-6">
      {/* Top Section - Candidate Info Row */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
        {/* Serial Number Box */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] md:min-w-[80px]">
          <span className={`text-[10px] sm:text-xs md:text-sm text-gray-600 font-semibold mb-1 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
            अक्र
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
            {serialNo}
          </span>
        </div>

        {/* Candidate Name Box */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 p-2 sm:p-3 md:p-4 flex-1 flex items-center min-h-[60px] sm:min-h-[70px] md:min-h-[80px]">
          <span className={`text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
            {candidateName}
          </span>
        </div>

        {/* Candidate Photo */}
        {candidatePhoto && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 p-1 sm:p-2 overflow-hidden w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] md:w-[80px] md:h-[80px] flex-shrink-0">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <Image
                src={candidatePhoto}
                alt={candidateName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 60px, (max-width: 768px) 70px, 80px"
              />
            </div>
          </div>
        )}

        {/* Election Symbol - Clock */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 p-2 sm:p-3 md:p-4 flex items-center justify-center w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] md:w-[80px] md:h-[80px] flex-shrink-0">
          <div className="relative w-full h-full flex items-center justify-center">
            <svg 
              className="w-full h-full text-gray-800"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>

        {/* Voting Icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
          <div className="bg-blue-600 rounded-lg p-2 sm:p-3">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Voting Instructions */}
      <div className="mb-3 sm:mb-4">
        <p className={`text-sm sm:text-base md:text-lg text-gray-800 font-semibold ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
          {texts.instruction}
        </p>
      </div>

      {/* Election Date and Time */}
      <div>
        <p className={`text-xs sm:text-sm md:text-base text-gray-700 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
          {texts.dateTime}
        </p>
      </div>
    </div>
  );
}

