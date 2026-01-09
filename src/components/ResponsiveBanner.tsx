'use client';

import { useState, useEffect } from 'react';

interface ResponsiveBannerProps {
  ward?: string | null;
}

// Mapping of wards to banner images
const wardBannerMap: { [key: string]: string } = {
  '165': '/Banners/165.jpg',
  '168': '/Banners/168.jpg',
  '170': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '140': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '141': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '143': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '144': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '145': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '146': '/Banners/320-px-x-190-px.jpg', // Add specific image when available
  '147': '/Banners/147.jpg',
  '148': '/Banners/148.jpg',
};

export default function ResponsiveBanner({ ward }: ResponsiveBannerProps) {
  const [selectedWard, setSelectedWard] = useState<string | null>(ward || null);

  // Listen for ward selection from URL or events
  useEffect(() => {
    // Get ward from URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const wardSet = urlParams.get('wardSet') || 
                    urlParams.get('wardset') || 
                    urlParams.get('WardSet') || 
                    urlParams.get('set') || 
                    urlParams.get('ward');
    
    if (wardSet) {
      // If wardSet is a single ward, use it directly
      const wards = wardSet.split(',').map(w => w.trim());
      if (wards.length === 1) {
        setSelectedWard(wards[0]);
        return;
      }
    }

    // Listen for ward selection events from VoterSearchForm
    const handleWardSelect = (event: CustomEvent) => {
      const selectedWardValue = event.detail?.ward;
      if (selectedWardValue) {
        setSelectedWard(selectedWardValue);
        // Store in localStorage for persistence
        localStorage.setItem('selectedWard', selectedWardValue);
      }
    };

    // Check localStorage for previously selected ward
    const storedWard = localStorage.getItem('selectedWard');
    if (storedWard && !wardSet) {
      setSelectedWard(storedWard);
    }

    window.addEventListener('wardSelected', handleWardSelect as EventListener);

    return () => {
      window.removeEventListener('wardSelected', handleWardSelect as EventListener);
    };
  }, [ward]);

  // Get banner image based on selected ward
  const getBannerImage = () => {
    if (selectedWard && wardBannerMap[selectedWard]) {
      return wardBannerMap[selectedWard];
    }
    // Default banner
    return '/320-190.png';
  };

  const bannerImage = getBannerImage();

  return (
    <picture className="w-full h-full block">
      {/* Tablet Landscape - 1024px and above, landscape orientation */}
      <source
        media="(min-width: 1024px) and (orientation: landscape)"
        srcSet={bannerImage}
      />
      
      {/* Tablet Portrait - 768px to 1023px, or tablet portrait */}
      <source
        media="(min-width: 768px) and (max-width: 1023px), (min-width: 768px) and (orientation: portrait)"
        srcSet={bannerImage}
      />
      
      {/* Mobile Landscape - 480px to 767px, landscape orientation */}
      <source
        media="(min-width: 480px) and (max-width: 767px) and (orientation: landscape)"
        srcSet={bannerImage}
      />
      
      {/* Mobile Portrait - Default for mobile portrait and smaller screens */}
      <source
        media="(max-width: 479px), (max-width: 767px) and (orientation: portrait)"
        srcSet={bannerImage}
      />
      
      {/* Fallback image for browsers that don't support picture element */}
      <img
        src={bannerImage}
        alt="Marketing Banner"
        className="w-full h-full object-cover"
        style={{ 
          objectPosition: 'center', 
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100%'
        }}
      />
    </picture>
  );
}
