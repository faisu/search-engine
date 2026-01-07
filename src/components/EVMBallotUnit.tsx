'use client';

import { useState } from 'react';
import Image from 'next/image';

interface EVMBallotUnitProps {
  ward?: string;
  language?: string;
  candidateSerialNo?: number; // The serial number to highlight (e.g., 3 for ward 140)
  candidatePhoto?: string; // Path to candidate photo image
  candidateName?: string; // Candidate name to display (per ward)
}

export default function EVMBallotUnit({ ward = '140', language = '1', candidateSerialNo = 3, candidatePhoto, candidateName }: EVMBallotUnitProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // Translations for different languages
  const translations: { [key: string]: { title: string; candidate: string; symbol: string; vote: string } } = {
    '1': {
      title: 'इलेक्ट्रॉनिक वोटिंग मशीन',
      candidate: 'उमेदवार',
      symbol: 'चिन्ह',
      vote: 'मतदान',
    },
    '2': {
      title: 'इलेक्ट्रॉनिक वोटिंग मशीन',
      candidate: 'उमेदवार',
      symbol: 'चिन्ह',
      vote: 'मतदान',
    },
    '3': {
      title: 'Electronic Voting Machine',
      candidate: 'Candidate',
      symbol: 'Symbol',
      vote: 'Vote',
    },
  };

  const texts = translations[language] || translations['1'];

  // Generate 6 candidate slots like real EVM
  const candidates = Array.from({ length: 6 }, (_, i) => i + 1);
  const ourCandidateSerialNo = candidateSerialNo || 3;
  // Use ward-specific candidate name when provided, otherwise default party name
  const displayCandidateName = candidateName || 'राष्ट्रवादी काँग्रेस पार्टी';

  const handleButtonClick = (serialNo: number) => {
    setSelectedCandidate(serialNo === selectedCandidate ? null : serialNo);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes moving-border {
          0% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.8),
                        0 0 0 2px rgba(250, 204, 21, 0.6),
                        0 0 10px rgba(250, 204, 21, 0.4);
          }
          25% {
            box-shadow: 2px -2px 0 0 rgba(250, 204, 21, 0.8),
                        2px -2px 0 2px rgba(250, 204, 21, 0.6),
                        2px -2px 10px rgba(250, 204, 21, 0.4);
          }
          50% {
            box-shadow: 0 2px 0 0 rgba(250, 204, 21, 0.8),
                        0 2px 0 2px rgba(250, 204, 21, 0.6),
                        0 2px 10px rgba(250, 204, 21, 0.4);
          }
          75% {
            box-shadow: -2px 0 0 0 rgba(250, 204, 21, 0.8),
                        -2px 0 0 2px rgba(250, 204, 21, 0.6),
                        -2px 0 10px rgba(250, 204, 21, 0.4);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.8),
                        0 0 0 2px rgba(250, 204, 21, 0.6),
                        0 0 10px rgba(250, 204, 21, 0.4);
          }
        }
        @keyframes blink-red {
          0%, 100% {
            opacity: 1;
            background-color: rgb(239, 68, 68);
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.8), 0 0 12px rgba(239, 68, 68, 0.6);
          }
          50% {
            opacity: 0.6;
            background-color: rgb(220, 38, 38);
            box-shadow: 0 0 4px rgba(239, 68, 68, 0.4), 0 0 8px rgba(239, 68, 68, 0.3);
          }
        }
        .moving-highlight {
          animation: moving-border 2s ease-in-out infinite;
        }
        .blink-red {
          animation: blink-red 1s ease-in-out infinite;
        }
        .blink-red-light {
          animation: blink-red 1s ease-in-out infinite;
        }
      `}</style>
      <div className="w-full max-w-2xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-2xl overflow-hidden border-2 sm:border-4 border-gray-300">
        {/* Top Dark Blue Strip */}
        <div className="bg-blue-900 h-2 sm:h-3 md:h-4"></div>

        {/* Main EVM Body */}
        <div className="bg-gray-200 p-2 sm:p-3 md:p-4">
          {/* EVM Title */}
          <div className="text-center mb-2 sm:mb-3 md:mb-4">
            <h3 className={`text-[10px] sm:text-xs md:text-sm font-bold text-gray-800 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
              {texts.title}
            </h3>
            {ward && (
              <p className="text-[9px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                {language === '1' || language === '2' ? `प्रभाग ${ward}` : `Ward ${ward}`}
              </p>
            )}
          </div>

          {/* EVM Content Area - 6 Rows Like Real EVM */}
          <div className="bg-white rounded border border-gray-400 sm:border-2 shadow-inner p-2 sm:p-3 md:p-4">
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2 md:gap-2.5">
              {/* Left Section - 6 Candidate Slots */}
              <div className="col-span-10 space-y-1 sm:space-y-1.5">
                {candidates.map((serialNo) => (
                  <div
                    key={serialNo}
                    className={`
                      bg-gray-100 border border-gray-300 sm:border-2 rounded 
                      p-1.5 sm:p-2 md:p-2.5 
                      ${serialNo === ourCandidateSerialNo ? 'h-[56px] sm:h-[64px] md:h-[72px]' : 'h-[36px] sm:h-[40px] md:h-[48px]'}
                      flex items-center gap-1.5 sm:gap-2 md:gap-3
                      ${selectedCandidate === serialNo ? 'border-blue-500 bg-blue-50 shadow-md' : ''}
                      ${serialNo === ourCandidateSerialNo ? 'ring-1 sm:ring-2 ring-yellow-400 bg-yellow-50/50 moving-highlight border-yellow-400' : ''}
                      transition-all
                    `}
                  >
                    {/* Serial Number - Always visible */}
                    <span className={`${serialNo === ourCandidateSerialNo ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-sm md:text-base'} font-bold text-gray-700 flex-shrink-0 w-5 sm:w-6 md:w-8 text-center`}>
                      {serialNo}
                    </span>
                    
                    {/* Candidate Symbol - Only show for our candidate */}
                    {serialNo === ourCandidateSerialNo ? (
                      <>
                        {/* Party Logo */}
                        <div className="flex-shrink-0 flex items-center">
                          <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14">
                            <Image
                              src="/download.png"
                              alt="NCP Logo"
                              fill
                              className="object-contain"
                              sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, (max-width: 1024px) 48px, 56px"
                            />
                          </div>
                        </div>
                        {/* Candidate Name - Only show for our candidate */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl text-gray-900 font-black truncate ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
                            {displayCandidateName}
                          </p>
                        </div>
                      </>
                    ) : (
                      /* Empty slot for other candidates */
                      <div className="flex-1 min-w-0">
                        <div className="h-3 sm:h-4 md:h-5 bg-gray-200 rounded w-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right Section - 6 Voting Buttons with Indicator Lights */}
              <div className="col-span-2 space-y-1 sm:space-y-1.5">
                {candidates.map((serialNo) => (
                  <div
                    key={serialNo}
                    className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 ${serialNo === ourCandidateSerialNo ? 'h-[56px] sm:h-[64px] md:h-[72px]' : 'h-[36px] sm:h-[40px] md:h-[48px]'}`}
                  >
                    {/* Red Indicator Light */}
                    <div className="flex-shrink-0">
                      <div
                        className={`
                          ${serialNo === ourCandidateSerialNo ? 'w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-red-500 blink-red-light shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-gray-300'} rounded-full 
                          border border-gray-400
                          ${selectedCandidate === serialNo ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] sm:shadow-[0_0_12px_rgba(239,68,68,1)]' : ''}
                          transition-all duration-200
                        `}
                      />
                    </div>

                    {/* Voting Button - Pill-shaped, wider buttons */}
                    <button
                      onClick={() => handleButtonClick(serialNo)}
                      className={`
                        flex-1 bg-blue-700 hover:bg-blue-800 active:bg-blue-900
                        text-white font-bold rounded-full
                        h-[36px] sm:h-[40px] md:h-[48px]
                        text-xs sm:text-sm md:text-base
                        shadow-md hover:shadow-lg
                        transition-all duration-200
                        transform hover:scale-[1.01] active:scale-[0.99]
                        ${selectedCandidate === serialNo ? 'ring-1 sm:ring-2 ring-yellow-400 ring-offset-0.5 sm:ring-offset-1' : ''}
                        ${serialNo === ourCandidateSerialNo ? 'ring-1 sm:ring-2 ring-yellow-400 moving-highlight' : ''}
                        flex items-center justify-center
                        px-4 sm:px-6 md:px-8
                      `}
                    >
                      {/* Intentionally no number/text inside buttons as per design */}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlight Message for Our Candidate */}
            {candidateSerialNo && (
              <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-yellow-50 border border-yellow-400 sm:border-2 rounded-lg">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {/* Party Logo */}
                  <div className="flex-shrink-0">
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10">
                      <Image
                        src="/download.png"
                        alt="NCP Logo"
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 24px, (max-width: 768px) 32px, 40px"
                      />
                    </div>
                  </div>
                  {/* Message Text */}
                  <p className={`text-center text-[10px] sm:text-xs md:text-sm font-black text-gray-900 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
                    {language === '1' || language === '2' 
                      ? `⚡ क्रमांक ${candidateSerialNo} (🕐 घड्याळ चिन्ह) यांना मतदान करा!`
                      : `⚡ Vote for Serial No. ${candidateSerialNo} (🕐 Clock Symbol)!`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Dark Blue Strip */}
        <div className="bg-blue-900 h-2 sm:h-3 md:h-4"></div>
        </div>
      </div>
    </>
  );
}

