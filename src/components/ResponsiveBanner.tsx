'use client';

import { useState, useEffect } from 'react';

interface ResponsiveBannerProps {
  ward?: string | null;
}

// Mapping of wards to banner images
const wardBannerMap: { [key: string]: string } = {
  '165': '/Banners/165.jpg',
  '168': '/Banners/168.jpg',
  '170': '/Banners/170.jpg', // Add specific image when available
  '140': '/Banners/140.jpg', // Add specific image when available
  '141': '/Banners/141.jpg', // Add specific image when available
  '143': '/Banners/143.jpg', // Add specific image when available
  '144': '/Banners/144.jpg', // Add specific image when available
  '145': '/Banners/145.jpg', // Add specific image when available
  '146': '/Banners/146.jpg', // Add specific image when available
  '147': '/Banners/147.jpg',
  '148': '/Banners/148.jpg',
};

export default function ResponsiveBanner({ ward }: ResponsiveBannerProps) {
  // Always start with null to show campaign-image.jpg by default
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  // Listen for ward selection events from VoterSearchForm
  useEffect(() => {
    // Listen for ward selection events from VoterSearchForm
    const handleWardSelect = (event: CustomEvent) => {
      const selectedWardValue = event.detail?.ward;
      if (selectedWardValue) {
        setSelectedWard(selectedWardValue);
        // Store in localStorage for persistence (but don't auto-load on mount)
        localStorage.setItem('selectedWard', selectedWardValue);
      } else {
        // If ward is null, reset to default banner and clear localStorage
        setSelectedWard(null);
        localStorage.removeItem('selectedWard');
      }
    };

    window.addEventListener('wardSelected', handleWardSelect as EventListener);

    return () => {
      window.removeEventListener('wardSelected', handleWardSelect as EventListener);
    };
  }, []);

  // Get banner image based on selected ward
  const getBannerImage = () => {
    // Show ward-specific banner if ward is selected and banner exists in map
    if (selectedWard && wardBannerMap[selectedWard]) {
      return wardBannerMap[selectedWard];
    }
    
    // Default banner (campaign-image.jpg) when no ward is selected or ward doesn't have specific banner
    return '/campaign-image.jpg';
  };

  const bannerImage = getBannerImage();

  return (
    <div className="w-full h-full p-2 sm:p-3 md:p-4 lg:p-6" style={{ boxSizing: 'border-box' }}>
      <img
        src={bannerImage}
        alt="Marketing Banner"
        className="w-full h-full object-cover rounded-lg"
        style={{ 
          objectPosition: 'center', 
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}
