'use client';

import { useState, useMemo } from 'react';
import WelcomeMessage from './WelcomeMessage';
import WardSelection from './WardSelection';
import WardImageDisplay from './WardImageDisplay';
import CandidateList from './CandidateList';
import SearchMethod from './SearchMethod';
import ResultList from './ResultList';
import VoterSlip from './VoterSlip';
import SelectedDataChips from './SelectedDataChips';

export default function VoterSearchForm() {
  const [currentStep, setCurrentStep] = useState<'language' | 'ward' | 'wardImage' | 'candidates' | 'method' | 'results' | 'slip'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [selectedSearchMethod, setSelectedSearchMethod] = useState<string | null>(null);
  const [methodSelected, setMethodSelected] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voterDetails, setVoterDetails] = useState<any>(null);
  const [showSlip, setShowSlip] = useState(false);

  const validWards = ['140', '141', '143', '144', '145', '146', '147', '148'];

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setCurrentStep('ward');
  };

  const handleWardSelect = (ward: string) => {
    setSelectedWard(ward);
    setCurrentStep('wardImage');
  };

  const handleWardImageContinue = () => {
    setCurrentStep('method');
  };

  const handleSearchMethodSelect = (method: string) => {
    setSelectedSearchMethod(method);
    setMethodSelected(true);
  };

  const handleInputSubmit = () => {
    if (!userInput.trim() || !selectedWard || !selectedSearchMethod) return;
    setError(null);
    setMethodSelected(false);
    setCurrentStep('candidates');
  };

  const handleCandidatesContinue = () => {
    setCurrentStep('results');
  };

  const handleMatchSelect = async (matchNumber: string, epic: string) => {
    if (!selectedWard) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/voter-details?epic=${encodeURIComponent(epic)}&ward=${encodeURIComponent(selectedWard)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch voter details');
      }

      const data = await response.json();

      if (data.success && data.voter) {
        setVoterDetails(data.voter);
        setShowSlip(true);
        setCurrentStep('slip');
        // Keep scroll position - don't jump to top
        setTimeout(() => {
          const currentScroll = window.scrollY;
          if (currentScroll > 0) {
            // If user has scrolled, maintain that position
            window.scrollTo({ top: currentScroll, behavior: 'auto' });
          }
        }, 50);
      } else {
        setError(data.error || 'Failed to fetch voter details');
      }
    } catch (err: any) {
      console.error('Error fetching voter details:', err);
      setError(err.message || 'Error fetching voter details');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep('language');
    setSelectedLanguage(null);
    setSelectedWard(null);
    setSelectedSearchMethod(null);
    setMethodSelected(false);
    setUserInput('');
    setVoterDetails(null);
    setShowSlip(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Build chips array from form state
  const chips = useMemo(() => {
    const chipArray: Array<{ id: string; label: string; value: string; type: 'language' | 'ward' | 'method' | 'input' | 'name' | 'voterId' }> = [];
    
    // Add language chip
    if (selectedLanguage) {
      const languageLabels: { [key: string]: string } = {
        '1': 'मराठी',
        '2': 'हिंदी',
        '3': 'English',
      };
      chipArray.push({
        id: 'language',
        label: 'Language',
        value: languageLabels[selectedLanguage] || 'Language',
        type: 'language',
      });
    }
    
    if (selectedWard) {
      chipArray.push({
        id: 'ward',
        label: 'Ward',
        value: selectedWard,
        type: 'ward',
      });
    }
    
    if (selectedSearchMethod) {
      const methodLabel = selectedLanguage === '1'
        ? selectedSearchMethod === '1' ? 'नावाने शोधा' : 'EPIC / Voter ID'
        : selectedLanguage === '2'
        ? selectedSearchMethod === '1' ? 'नाम से खोजें' : 'EPIC / Voter ID'
        : selectedSearchMethod === '1' ? 'Search by Name' : 'EPIC / Voter ID';
      
      chipArray.push({
        id: 'method',
        label: 'Method',
        value: methodLabel,
        type: 'method',
      });
    }
    
    if (userInput && selectedSearchMethod) {
      chipArray.push({
        id: 'input',
        label: selectedSearchMethod === '1' ? 'Name' : 'Voter ID',
        value: userInput,
        type: selectedSearchMethod === '1' ? 'name' : 'voterId',
      });
    }
    
    return chipArray;
  }, [selectedWard, selectedSearchMethod, userInput, selectedLanguage, currentStep]);

  // Handle chip removal
  const handleChipRemove = (id: string, type: string) => {
    switch (type) {
      case 'language':
        handleReset();
        break;
      case 'ward':
        setSelectedWard(null);
        setCurrentStep('ward');
        setSelectedSearchMethod(null);
        setMethodSelected(false);
        setUserInput('');
        break;
      case 'method':
        setSelectedSearchMethod(null);
        setMethodSelected(false);
        setUserInput('');
        setCurrentStep('method');
        break;
      case 'name':
      case 'voterId':
        setUserInput('');
        setMethodSelected(false);
        setCurrentStep('method');
        break;
    }
  };

  return (
    <div className="w-full mx-auto" data-form-container style={{ maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Progress Indicator */}
      {selectedLanguage && (
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8 w-full px-2 sm:px-4 md:px-0">
          <div className="flex items-center justify-center overflow-x-auto pb-2 sm:pb-3 md:pb-2 pt-1 sm:pt-2 md:pt-1 w-full max-w-full scrollbar-hide">
            <div className="flex items-center w-full max-w-2xl">
              {['language', 'ward', 'method', 'candidates', 'results', 'slip'].map((step, index) => {
                // Map current step to progress index (wardImage counts as ward completion)
                const stepIndexMap: { [key: string]: number } = {
                  'language': 0,
                  'ward': 1,
                  'wardImage': 1, // wardImage is part of ward step
                  'method': 2,
                  'candidates': 3,
                  'results': 4,
                  'slip': 5
                };
                const currentStepIndex = stepIndexMap[currentStep] ?? 0;
                const stepProgressIndex = stepIndexMap[step] ?? 0;
                const isActive = stepProgressIndex <= currentStepIndex;
                const isCurrent = stepProgressIndex === currentStepIndex || (step === 'ward' && currentStep === 'wardImage');

                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex items-center justify-center flex-shrink-0">
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold transition-all relative z-10 ${
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-200 text-gray-500'
                        } ${isCurrent ? 'ring-2 sm:ring-3 ring-blue-200 scale-105 sm:scale-110' : ''}`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    {index < 5 && (
                      <div
                        className={`flex-1 h-0.5 sm:h-1 transition-all mx-1 sm:mx-2 ${
                          isActive ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Selected Data Chips */}
      {selectedLanguage && chips.length > 0 && (
        <div className="mb-4 sm:mb-6 w-full">
          <SelectedDataChips
            chips={chips}
            onRemove={handleChipRemove}
            language={selectedLanguage}
          />
        </div>
      )}

      {/* Form Steps - Show only current step */}
      <div className="min-h-[400px]">
            {/* Step 1: Language Selection */}
            {currentStep === 'language' && (
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
                <WelcomeMessage onLanguageSelect={handleLanguageSelect} />
              </div>
            )}

        {/* Step 2: Ward Selection */}
        {currentStep === 'ward' && selectedLanguage && (
          <WardSelection onWardSelect={handleWardSelect} language={selectedLanguage} />
        )}

        {/* Step 2.5: Ward Image Display */}
        {currentStep === 'wardImage' && selectedLanguage && selectedWard && (
          <WardImageDisplay ward={selectedWard} language={selectedLanguage} onContinue={handleWardImageContinue} />
        )}

        {/* Step 3: Search Method & Input (Combined) */}
        {currentStep === 'method' && selectedLanguage && selectedWard && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
            {!methodSelected ? (
              <SearchMethod onMethodSelect={handleSearchMethodSelect} language={selectedLanguage} ward={selectedWard} />
            ) : (
              <div className="space-y-4">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    {selectedLanguage === '1'
                      ? selectedSearchMethod === '1'
                        ? 'निवडलेली पद्धत: नावाने शोधा'
                        : 'निवडलेली पद्धत: EPIC / Voter ID'
                      : selectedLanguage === '2'
                      ? selectedSearchMethod === '1'
                        ? 'चुनी गई विधि: नाम से खोजें'
                        : 'चुनी गई विधि: EPIC / Voter ID'
                      : selectedSearchMethod === '1'
                      ? 'Selected Method: Search by Name'
                      : 'Selected Method: EPIC / Voter ID'}
                  </p>
                </div>
                <h3 className={`text-xl sm:text-2xl font-heading font-bold text-gray-800 mb-4 tracking-tight ${selectedLanguage === '1' || selectedLanguage === '2' ? 'font-devanagari' : ''}`}>
                  {selectedLanguage === '1'
                    ? selectedSearchMethod === '1'
                      ? 'नाव प्रविष्ट करा'
                      : 'EPIC / Voter ID प्रविष्ट करा'
                    : selectedLanguage === '2'
                    ? selectedSearchMethod === '1'
                      ? 'नाम दर्ज करें'
                      : 'EPIC / Voter ID दर्ज करें'
                    : selectedSearchMethod === '1'
                    ? 'Enter Name'
                    : 'Enter EPIC / Voter ID'}
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleInputSubmit();
                      }
                    }}
                        placeholder={
                          selectedLanguage === '1'
                            ? selectedSearchMethod === '1'
                              ? 'उदा: राम कृष्ण पाटील'
                              : 'उदा: ABC1234567'
                            : selectedLanguage === '2'
                            ? selectedSearchMethod === '1'
                              ? 'उदाहरण: राम कृष्ण पाटिल'
                              : 'उदाहरण: ABC1234567'
                            : selectedSearchMethod === '1'
                            ? 'e.g., Ram Krishna Patil'
                            : 'e.g., ABC1234567'
                        }
                    className="w-full px-4 py-3 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-base sm:text-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <button
                    onClick={handleInputSubmit}
                    disabled={!userInput.trim() || loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading
                      ? selectedLanguage === '1'
                        ? 'शोधत आहे...'
                        : selectedLanguage === '2'
                        ? 'खोज रहा है...'
                        : 'Searching...'
                      : selectedLanguage === '1'
                      ? 'शोध करा'
                      : selectedLanguage === '2'
                      ? 'खोजें'
                      : 'Search'}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3.5: Candidate List / EVM Display */}
        {currentStep === 'candidates' && selectedLanguage && selectedWard && (
          <CandidateList ward={selectedWard} language={selectedLanguage} onContinue={handleCandidatesContinue} />
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && selectedLanguage && selectedWard && selectedSearchMethod && userInput && (
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
            <ResultList
              onMatchSelect={handleMatchSelect}
              language={selectedLanguage}
              ward={selectedWard}
              searchMethod={selectedSearchMethod}
              userInputValue={userInput}
            />
          </div>
        )}

        {/* Step 5: Voter Slip */}
        {currentStep === 'slip' && showSlip && selectedLanguage && voterDetails && (
          <div className="space-y-6 sm:space-y-8 w-full max-w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full" style={{ boxSizing: 'border-box', overflowX: 'hidden' }}>
              <VoterSlip
                language={selectedLanguage}
                voterDetails={{
                  name: voterDetails.name || 'N/A',
                  epic: voterDetails.epic || 'N/A',
                  ward: voterDetails.ward || selectedWard || 'N/A',
                  sr_no: voterDetails.sr_no ?? null,
                  partBooth: voterDetails.partBooth || selectedWard || 'N/A',
                  pollingStation: voterDetails.pollingStation || 'Polling Station',
                  pollingAddress: voterDetails.pollingAddress || voterDetails.address || 'Address not available',
                  age: voterDetails.age || null,
                  pincode: voterDetails.pincode || null,
                  ac_no: voterDetails.ac_no || '172',
                  gender: voterDetails.gender || null,
                }}
              />
            </div>
            <div className="flex justify-center pb-8">
              <button
                onClick={handleReset}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 sm:py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {selectedLanguage === '1' ? 'नवीन शोध' : selectedLanguage === '2' ? 'नया खोज' : 'New Search'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

