'use client';

import { useState, useEffect, useRef } from 'react';

interface VoterMatch {
  id: number;
  name: string;
  age: number | null;
  epic: string;
  ward: string;
  sr_no: string | null;
  address: string | null;
  house_number: string | null;
  gender: string | null;
  pincode: string | null;
}

interface ResultListProps {
  onMatchSelect: (matchNumber: string, epic: string) => void;
  language: string;
  ward: string;
  searchMethod: string;
  userInputValue: string;
}

export default function ResultList({ onMatchSelect, language, ward, searchMethod, userInputValue }: ResultListProps) {
  const [matches, setMatches] = useState<VoterMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(5); // Number of results to display
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!userInputValue || !ward || !searchMethod) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search-voters?ward=${encodeURIComponent(ward)}&method=${encodeURIComponent(searchMethod)}&query=${encodeURIComponent(userInputValue)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch voters');
        }

        const data = await response.json();

        if (data.success) {
          setMatches(data.matches || []);
          setDisplayCount(5); // Reset display count when new search is performed
        } else {
          setError(data.error || 'No voters found');
          setMatches([]);
          setDisplayCount(5);
        }
      } catch (err: any) {
        console.error('Error fetching voters:', err);
        setError(err.message || 'Error searching voters');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [ward, searchMethod, userInputValue]);

  useEffect(() => {
    // Scroll into view when component first appears or when results are loaded - optimized for mobile/tablet
    const scrollToComponent = () => {
      if (containerRef.current && !loading && matches.length > 0) {
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
  }, [loading, matches.length]);

  const translations: { [key: string]: { heading: string; footer: string; showMore: string } } = {
    '1': {
      heading: 'प्रभाग',
      footer: 'क्रमांक उत्तर म्हणून पाठवा',
      showMore: 'अधिक दाखवा',
    },
    '2': {
      heading: 'वार्ड',
      footer: 'उत्तर के रूप में नंबर भेजें',
      showMore: 'और दिखाएं',
    },
    '3': {
      heading: 'Ward',
      footer: 'Send the number as an answer',
      showMore: 'Show More',
    },
  };

  const handleShowMore = () => {
    setDisplayCount(prev => prev + 5);
  };

  const displayedMatches = matches.slice(0, displayCount);
  const hasMore = matches.length > displayCount;

  const texts = translations[language] || translations['1'];

  return (
    <div ref={containerRef} className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      {/* Heading */}
      <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 text-center">
        {texts.heading} {ward} {language === '1' ? 'मध्ये परिणाम' : language === '2' ? 'में परिणाम' : 'Results'}
      </h2>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs sm:text-sm">
              {language === '1' ? 'शोधत आहे...' : language === '2' ? 'खोज रहा है...' : 'Searching...'}
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-4">
          <p className="text-xs sm:text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State for Slip */}
      {loadingMatchId !== null && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs sm:text-sm">
              {language === '1' ? 'स्लिप तयार करत आहे...' : language === '2' ? 'स्लिप बना रहा है...' : 'Generating slip...'}
            </span>
          </div>
        </div>
      )}

      {/* Matches List */}
      {!loading && !error && matches.length === 0 && loadingMatchId === null && (
        <div className="text-center py-4">
          <p className="text-xs sm:text-sm text-gray-600">
            {language === '1' ? 'कोणतेही मतदार सापडले नाहीत' : language === '2' ? 'कोई मतदाता नहीं मिला' : 'No voters found'}
          </p>
        </div>
      )}

      {!loading && !error && matches.length > 0 && loadingMatchId === null && (
        <>
          <div className="space-y-2.5 mb-3 sm:mb-4">
            {displayedMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => {
                  setLoadingMatchId(match.id);
                  onMatchSelect(match.id.toString(), match.epic);
                }}
                className="w-full flex items-center gap-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-800 text-xs sm:text-sm font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-all text-left border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex-shrink-0 flex items-center justify-center shadow-sm">
                  <span className="text-[10px] sm:text-xs font-bold text-white">{match.id}</span>
                </div>
                <div className="flex-1">
                  <span className="block">{match.name}</span>
                  <span className="text-[10px] sm:text-xs text-gray-600">
                    {match.age && `${language === '1' ? 'वय' : language === '2' ? 'उम्र' : 'Age'}: ${match.age}`}
                    {match.age && match.sr_no && ' | '}
                    {match.sr_no && `${language === '1' ? 'SR' : language === '2' ? 'SR' : 'SR'}: ${match.sr_no}`}
                    {match.pincode && (match.age || match.sr_no) && ' | '}
                    {match.pincode && `${language === '1' ? 'पिन' : language === '2' ? 'पिन' : 'Pin'}: ${match.pincode}`}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center mb-3 sm:mb-4">
              <button
                onClick={handleShowMore}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 sm:py-2.5 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm"
              >
                {texts.showMore}
              </button>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <p className="text-[10px] sm:text-xs text-gray-600 text-center border-t border-gray-200/50 pt-2 sm:pt-3 font-medium">
        {texts.footer}
      </p>
    </div>
  );
}

