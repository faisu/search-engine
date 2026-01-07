'use client';

import { useEffect, useRef } from 'react';

interface WardSelectionProps {
  onWardSelect: (ward: string) => void;
  language: string;
}

export default function WardSelection({ onWardSelect, language }: WardSelectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll into view when component first appears - optimized for mobile/tablet
    const scrollToComponent = () => {
      if (containerRef.current) {
        // Small delay to ensure component is fully rendered
        setTimeout(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const isMobile = window.innerWidth < 768;
            const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
            
            // For mobile/tablet, use center alignment for better visibility
            // For desktop, use start alignment
            const blockValue = (isMobile || isTablet) ? 'center' : 'start';
            
            containerRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: blockValue,
              inline: 'nearest'
            });
            
            // Fallback for better mobile support - adjust scroll position manually
            if (isMobile || isTablet) {
              setTimeout(() => {
                const currentRect = containerRef.current?.getBoundingClientRect();
                if (currentRect) {
                  const scrollOffset = currentRect.top + window.scrollY - (window.innerHeight / 2) + (currentRect.height / 2);
                  window.scrollTo({
                    top: Math.max(0, scrollOffset),
                    behavior: 'smooth'
                  });
                }
              }, 100);
            }
          }
        }, 50);
      }
    };

    scrollToComponent();
  }, []);
  const wards = ['140', '141', '143', '144', '145', '146', '147', '148'];

  const translations: { [key: string]: { heading: string; footer: string } } = {
    '1': {
      heading: 'आपला प्रभाग निवडा',
      footer: 'अणुशक्ती नगर (१७२) मतदारसंघ',
    },
    '2': {
      heading: 'अपना वार्ड चुनें',
      footer: 'अणुशक्ती नगर (१७२) मतदारसंघ',
    },
    '3': {
      heading: 'Select your ward',
      footer: 'Anushakti Nagar (172) Constituency',
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <div ref={containerRef} className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      {/* Heading */}
      <h2 className={`text-base sm:text-lg font-heading font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 text-center tracking-tight ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
        {texts.heading}
      </h2>

      {/* Wards Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
        {wards.map((ward) => (
          <button
            key={ward}
            onClick={() => onWardSelect(ward)}
            className="bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-2 border-blue-300 hover:border-blue-500 text-blue-700 font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 text-center text-sm sm:text-base shadow-sm hover:shadow-md"
          >
            {ward}
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className={`text-[10px] sm:text-xs text-gray-600 text-center border-t border-gray-200/50 pt-2 sm:pt-3 font-body ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
        {texts.footer}
      </p>
    </div>
  );
}

