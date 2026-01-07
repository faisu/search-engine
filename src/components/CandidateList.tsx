'use client';

import EVMBallotUnit from './EVMBallotUnit';

interface Candidate {
  serialNo: number;
  name: string;
  photo?: string;
  symbol: string;
  symbolIcon?: string;
}

interface CandidateListProps {
  ward: string;
  language: string;
  onContinue: () => void;
}

// Ward to candidate serial number mapping for marketing purposes
const getCandidateForWard = (ward: string): Candidate | null => {
  // Map wards to our candidate's serial number and name
  const wardToCandidateMap: { [key: string]: { serialNo: number; name: string } } = {
    '140': { serialNo: 6, name: 'श्रीमती ज्योति सदावर्ते' },
    // 145: from user data
    '145': { serialNo: 1, name: 'श्री शब्बीर सिद्दीक खान' },
    // 146: from user data
    '146': { serialNo: 3, name: 'कू. भाग्यश्री राजेश केदारे' },
    // 147: from slip image
    '147': { serialNo: 2, name: 'कु. अंकिता संदीप दवे' },
    // 148: from slip image
    '148': { serialNo: 2, name: 'सोमू चंद पवार' },
    // Other wards currently default to party name at serial no 3
    '141': { serialNo: 3, name: 'राष्ट्रवादी काँग्रेस पार्टी' },
    '143': { serialNo: 3, name: 'राष्ट्रवादी काँग्रेस पार्टी' },
    '144': { serialNo: 3, name: 'राष्ट्रवादी काँग्रेस पार्टी' },
  };

  const candidateData = wardToCandidateMap[ward];
  if (!candidateData) return null;

  // Return only our candidate with clock symbol
  return {
    serialNo: candidateData.serialNo,
    name: candidateData.name,
    symbol: 'Clock',
    symbolIcon: '🕐',
    photo: '/Screenshot 2026-01-06 at 11.19.09 AM.png', // Candidate photo
  };
};

export default function CandidateList({ ward, language, onContinue }: CandidateListProps) {
  const candidate = getCandidateForWard(ward);
  
  if (!candidate) {
    // If no candidate found for ward, show error or skip
    return null;
  }

  const translations: { [key: string]: { heading: string; columns: { serialNo: string; name: string; photo: string; symbol: string; button: string }; continueButton: string } } = {
    '1': {
      heading: `प्रभाग ${ward} उमेदवार`,
      columns: {
        serialNo: 'क्रमांक',
        name: 'उमेदवाराचे नाव',
        photo: 'छायाचित्र',
        symbol: 'चिन्ह',
        button: 'बटण',
      },
      continueButton: 'पुढे जा',
    },
    '2': {
      heading: `वार्ड ${ward} उमेदवार`,
      columns: {
        serialNo: 'क्रमांक',
        name: 'उमेदवार का नाम',
        photo: 'छायाचित्र',
        symbol: 'चिन्ह',
        button: 'बटण',
      },
      continueButton: 'आगे बढ़ें',
    },
    '3': {
      heading: `Ward ${ward} Candidates`,
      columns: {
        serialNo: 'Serial No.',
        name: 'Candidate Name',
        photo: 'Photograph',
        symbol: 'Symbol',
        button: 'Button',
      },
      continueButton: 'Continue',
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <>
      {/* EVM Ballot Unit */}
      <div className="mt-6 mb-4">
        <EVMBallotUnit 
          ward={ward} 
          language={language} 
          candidateSerialNo={candidate?.serialNo || 3}
          candidatePhoto={candidate?.photo}
          candidateName={candidate?.name}
        />
      </div>

      {/* Continue Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={onContinue}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
        >
          {texts.continueButton}
        </button>
      </div>
    </>
  );
}

