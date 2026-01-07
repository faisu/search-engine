'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface WardImageDisplayProps {
  ward: string;
  language: string;
  onContinue: () => void;
}

export default function WardImageDisplay({ ward, language, onContinue }: WardImageDisplayProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll into view when component first appears - optimized for mobile/tablet
    const scrollToComponent = () => {
      if (containerRef.current) {
        // Small delay to ensure component is fully rendered
        setTimeout(() => {
          if (containerRef.current) {
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
  // Mapping of ward numbers to slip images
  const wardToImageMap: { [key: string]: string } = {
    '140': '/Slips/140.jpeg',
    '141': '/Slips/141.jpeg',
    '143': '/Slips/143.jpeg',
    '144': '/Slips/144.jpeg',
    '145': '/Slips/145.jpeg',
    '146': '/Slips/146.jpeg',
    '147': '/Slips/147.jpeg',
    '148': '/Slips/148.jpeg',
  };

  // Get the image for the selected ward, or use a default
  const wardImage = wardToImageMap[ward] || '/Slips/140.jpeg';

  const translations: { [key: string]: { title: string; continueButton: string } } = {
    '1': {
      title: `वार्ड ${ward} ची माहिती`,
      continueButton: 'पुढे जा',
    },
    '2': {
      title: `वार्ड ${ward} की जानकारी`,
      continueButton: 'आगे बढ़ें',
    },
    '3': {
      title: `Ward ${ward} Information`,
      continueButton: 'Continue',
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <div ref={containerRef} className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 sm:p-5 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      {/* Title */}
      <h2 className={`text-base sm:text-lg font-heading font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center tracking-tight ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
        {texts.title}
      </h2>

      {/* Ward Image */}
      <div className="relative w-full max-w-md mx-auto mb-4 rounded-lg overflow-hidden shadow-lg border-2 border-blue-200">
        <div className="relative aspect-[3/4] w-full">
          {/* Loader overlay while image is loading */}
          {!isImageLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-[10px] sm:text-xs text-gray-600 text-center px-4">
                {language === '3'
                  ? 'Loading ward image...'
                  : 'वार्डचे छायाचित्र लोड होत आहे...'}
              </p>
            </div>
          )}

          <Image
            src={wardImage}
            alt={`Ward ${ward} Information`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 400px"
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onContinue}
          disabled={!isImageLoaded}
          className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            !isImageLoaded 
              ? 'opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-lg' 
              : ''
          }`}
        >
          {texts.continueButton}
        </button>
      </div>
    </div>
  );
}

