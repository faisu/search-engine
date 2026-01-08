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

  const handleShareOnWhatsApp = () => {
    // Format message based on language
    let message = '';
    
    if (language === '1') { // Marathi
      message = `${voterDetails.epic}`;
    } else if (language === '2') { // Hindi
      message = `${voterDetails.epic}`;
    } else { // English
      message = `${voterDetails.epic}`;
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp - user can choose recipient
    // To send to specific number, use: const phoneNumber = '919876543210';
    const phoneNumber = '+919893229983';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    // const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const translations: { [key: string]: { [key: string]: string } } = {
    '1': {
      downloadCampaign: 'प्रचार प्रतिमा डाउनलोड करा',
      generatingCampaign: 'प्रचार प्रतिमा तयार होत आहे...',
      shareWhatsApp: 'WhatsApp वर शेअर करा',
    },
    '2': {
      downloadCampaign: 'प्रचार छवि डाउनलोड करें',
      generatingCampaign: 'प्रचार छवि बन रही है...',
      shareWhatsApp: 'WhatsApp पर शेयर करें',
    },
    '3': {
      downloadCampaign: 'Download Campaign Image',
      generatingCampaign: 'Generating campaign image...',
      shareWhatsApp: 'Share on WhatsApp',
    },
  };

  const texts = translations[language] || translations['1'];

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-3 sm:p-4 shadow-xl border border-blue-100/50 backdrop-blur-sm">
      {/* Action Buttons - Always visible when image is loaded */}
      {campaignImageUrl && (
        <div className="flex justify-end gap-2 mb-3">
          <button
            onClick={handleShareOnWhatsApp}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 active:scale-95"
            aria-label={texts.shareWhatsApp}
            title={texts.shareWhatsApp}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
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
                {/* Close Button - Left side */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 left-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all z-10 shadow-lg"
                  aria-label="Close"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Action Buttons in Modal - Right side */}
                {campaignImageUrl && (
                  <div className="absolute top-4 right-4 flex gap-3 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareOnWhatsApp();
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full p-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                      aria-label={texts.shareWhatsApp}
                      title={texts.shareWhatsApp}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadCampaignImage();
                      }}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-full p-3 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                      aria-label={texts.downloadCampaign}
                      title={texts.downloadCampaign}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </div>
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
