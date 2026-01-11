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
            <div className="flex">
              {/* Left Section - 6 Candidate Slots */}
              <div className="flex-1 space-y-1 sm:space-y-1.5">
                {candidates.map((serialNo) => (
                  <div
                    key={serialNo}
                    className={`
                      ${serialNo === ourCandidateSerialNo ? 'h-[56px] sm:h-[64px] md:h-[72px]' : 'h-[36px] sm:h-[40px] md:h-[48px]'}
                      flex items-center gap-1.5 sm:gap-2 md:gap-3
                      ${selectedCandidate === serialNo ? 'border-blue-500 bg-blue-50 shadow-md rounded p-1.5 sm:p-2 md:p-2.5 border-2' : ''}
                      transition-all
                    `}
                  >
                    {/* Serial Number - Show box for our candidate, simple number for others */}
                    {serialNo === ourCandidateSerialNo ? (
                      /* Serial Number Box with "अक्र" label */
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-0.5 sm:p-1 md:p-1.5 flex flex-col items-center justify-center min-w-[40px] sm:min-w-[50px] md:min-w-[60px] flex-shrink-0">
                        <span className={`text-[7px] sm:text-[9px] md:text-[10px] text-gray-600 font-semibold mb-0.5 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
                          अक्र
                        </span>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
                          {serialNo}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-xs sm:text-sm md:text-base font-bold text-gray-700 flex-shrink-0 w-5 sm:w-6 md:w-8 text-center`}>
                        {serialNo}
                      </span>
                    )}
                    
                    {/* Candidate Symbol - Only show for our candidate */}
                    {serialNo === ourCandidateSerialNo ? (
                      <>
                        {/* Campaign Banner Style Layout */}
                        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-1 min-w-0">
                          {/* Candidate Name Box */}
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-0.5 sm:p-1 md:p-1.5 flex items-center min-h-[40px] sm:min-h-[50px] md:min-h-[60px] flex-1 min-w-0">
                            <span className={`text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-gray-900 whitespace-nowrap pl-1 sm:pl-1.5 md:pl-2 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
                              {displayCandidateName}
                            </span>
                          </div>
                          
                          {/* Candidate Photo */}
                          {candidatePhoto && (
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-0.5 overflow-hidden w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] flex-shrink-0">
                              <div className="relative w-full h-full rounded-md overflow-hidden">
                                <Image
                                  src={candidatePhoto}
                                  alt={displayCandidateName}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 40px, (max-width: 768px) 50px, 60px"
                                />
                              </div>
                            </div>
                          )}

                          {/* Election Symbol - Clock */}
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-0.5 flex items-center justify-center w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] md:w-[60px] md:h-[60px] flex-shrink-0">
                            <div className="relative w-full h-full flex items-center justify-center">
                              <Image
                                src="/logo.png"
                                alt="Clock Symbol"
                                fill
                                className="object-contain"
                                sizes="(max-width: 640px) 40px, (max-width: 768px) 50px, 60px"
                              />
                            </div>
                          </div>
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
              <div className="flex-shrink-0 space-y-1 sm:space-y-1.5 flex flex-col items-end pl-1 sm:pl-1.5 md:pl-2">
                {candidates.map((serialNo) => (
                  <div
                    key={serialNo}
                    className={`flex items-center justify-end gap-0.5 sm:gap-1 ${serialNo === ourCandidateSerialNo ? 'h-[56px] sm:h-[64px] md:h-[72px]' : 'h-[36px] sm:h-[40px] md:h-[48px]'}`}
                  >
                    {/* Red Dot */}
                    <div className="flex-shrink-0">
                      <div
                        className={`
                          w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full
                          ${serialNo === ourCandidateSerialNo ? 'bg-red-500 blink-red-light shadow-[0_0_3px_rgba(239,68,68,0.8)]' : selectedCandidate === serialNo ? 'bg-red-500 blink-red-light shadow-[0_0_3px_rgba(239,68,68,0.8)]' : 'bg-gray-300'}
                          transition-all duration-200
                        `}
                      />
                    </div>

                    {/* Voting Button - Blue Rounded Rectangle */}
                    <button
                      onClick={() => handleButtonClick(serialNo)}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md w-[24px] h-[10px] sm:w-[32px] sm:h-[12px] md:w-[40px] md:h-[14px] transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex-shrink-0"
                      style={{ minWidth: '24px', minHeight: '10px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Dark Blue Strip */}
        <div className="bg-blue-900 h-2 sm:h-3 md:h-4"></div>
        </div>
      </div>
    </>
  );
}

