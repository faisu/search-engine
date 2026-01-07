'use client';

interface ChipData {
  id: string;
  label: string;
  value: string;
  type: 'language' | 'ward' | 'method' | 'input' | 'name' | 'voterId';
}

interface SelectedDataChipsProps {
  chips: ChipData[];
  onRemove: (id: string, type: string) => void;
  language: string;
}

export default function SelectedDataChips({ chips, onRemove, language }: SelectedDataChipsProps) {
  if (chips.length === 0) return null;

  const getTypeLabel = (type: string): string => {
    const labels: { [key: string]: { [key: string]: string } } = {
      language: {
        '1': 'भाषा',
        '2': 'भाषा',
        '3': 'Language',
      },
      ward: {
        '1': 'प्रभाग',
        '2': 'वार्ड',
        '3': 'Ward',
      },
      method: {
        '1': 'पद्धत',
        '2': 'विधि',
        '3': 'Method',
      },
      input: {
        '1': 'इनपुट',
        '2': 'इनपुट',
        '3': 'Input',
      },
      name: {
        '1': 'नाव',
        '2': 'नाम',
        '3': 'Name',
      },
      voterId: {
        '1': 'Voter ID',
        '2': 'Voter ID',
        '3': 'Voter ID',
      },
    };

    return labels[type]?.[language] || labels[type]?.['3'] || type;
  };

  return (
    <div className="mb-4 sm:mb-6 w-full">
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        {chips.map((chip) => (
          <div
            key={chip.id}
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm hover:shadow-md transition-all group"
          >
            <span className={`text-xs sm:text-sm font-semibold text-blue-700 ${language === '1' || language === '2' ? 'font-devanagari' : ''}`}>
              <span className="text-gray-600">{getTypeLabel(chip.type)}:</span>{' '}
              <span className="text-blue-800">{chip.value}</span>
            </span>
            <button
              onClick={() => onRemove(chip.id, chip.type)}
              className="ml-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 flex items-center justify-center transition-all flex-shrink-0 group-hover:scale-110"
              aria-label={language === '1' ? 'काढा' : language === '2' ? 'हटाएं' : 'Remove'}
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

