'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface VoterSlipProps {
  language: string;
  voterDetails: {
    name: string;
    epic: string;
    ward: string;
    sr_no?: string | number | null;
    partBooth: string;
    pollingStation: string;
    pollingAddress: string;
    age?: number | null;
    pincode?: string | null;
    ac_no?: string | null;
    gender?: string | null;
  };
}

export default function VoterSlip({ language, voterDetails }: VoterSlipProps) {
  const [campaignImageUrl, setCampaignImageUrl] = useState<string | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure portal only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate campaign image on component mount
  useEffect(() => {
    const generateCampaignImage = async () => {
      if (!voterDetails.ward) {
        console.error('Ward number is missing');
        return;
      }

      setIsGeneratingCampaign(true);
      try {
        const response = await fetch('/api/generate-campaign-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ward: voterDetails.ward,
            language: language,
            voterDetails: {
              name: voterDetails.name,
              epic: voterDetails.epic,
              age: voterDetails.age,
              gender: voterDetails.gender || 'N/A',
              sr_no: voterDetails.sr_no ?? null,
              partBooth: voterDetails.partBooth,
              pollingStation: voterDetails.pollingStation,
              pollingAddress: voterDetails.pollingAddress,
            },
          }),
        });

        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setCampaignImageUrl(imageUrl);
          // Auto-open modal in fullscreen when image is ready
          setIsModalOpen(true);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to generate campaign image:', response.status, errorData);
        }
      } catch (error) {
        console.error('Error generating campaign image:', error);
      } finally {
        setIsGeneratingCampaign(false);
      }
    };

    generateCampaignImage();
  }, [voterDetails, language]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (campaignImageUrl) {
        URL.revokeObjectURL(campaignImageUrl);
      }
    };
  }, [campaignImageUrl]);

  const handleDownloadCampaignImage = async () => {
    if (!campaignImageUrl) return;

    try {
      const response = await fetch(campaignImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-${voterDetails.ward}-${voterDetails.epic || 'voter'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading campaign image:', error);
    }
  };

  const translations: { [key: string]: { [key: string]: string } } = {
    '1': {
      downloadCampaign: 'प्रचार प्रतिमा डाउनलोड करा',
      generatingCampaign: 'प्रचार प्रतिमा तयार होत आहे...',
    },
    '2': {
      downloadCampaign: 'प्रचार छवि डाउनलोड करें',
      generatingCampaign: 'प्रचार छवि बन रही है...',
    },
    '3': {
      downloadCampaign: 'Download Campaign Image',
      generatingCampaign: 'Generating campaign image...',
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      {/* Download Button - Always visible when image is loaded */}
      {campaignImageUrl && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleDownloadCampaignImage}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"
            aria-label={texts.downloadCampaign}
            title={texts.downloadCampaign}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      )}

      {/* Campaign Image Section */}
      {isGeneratingCampaign ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">{texts.generatingCampaign}</p>
          </div>
        </div>
      ) : campaignImageUrl ? (
        <>
          {/* Thumbnail Preview - Clickable to reopen modal */}
          <div 
            className="w-full cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            <img
              src={campaignImageUrl}
              alt="Campaign Image"
              className="w-full h-auto object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Fullscreen Modal - Opens automatically on all screen sizes - Rendered via Portal */}
          {isModalOpen && isMounted && typeof window !== 'undefined' && createPortal(
            <div 
              className="fixed inset-0 z-[99999] bg-black bg-opacity-95 flex items-center justify-center p-4"
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all z-10 shadow-lg"
                  aria-label="Close"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Download Button in Modal */}
                {campaignImageUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadCampaignImage();
                    }}
                    className="absolute top-4 right-20 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-full p-3 transition-all z-10 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                    aria-label={texts.downloadCampaign}
                    title={texts.downloadCampaign}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                )}
                
                {/* Fullscreen Image - Maximum size */}
                <img
                  src={campaignImageUrl}
                  alt="Campaign Image"
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>,
            document.body
          )}
        </>
      ) : null}
    </div>
  );
}
