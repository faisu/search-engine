'use client';

export default function ResponsiveBanner() {
  return (
    <picture className="w-full h-full block">
      {/* Tablet Landscape - 1024px and above, landscape orientation */}
      <source
        media="(min-width: 1024px) and (orientation: landscape)"
        srcSet="/1026-260.png"
      />
      
      {/* Tablet Portrait - 768px to 1023px, or tablet portrait */}
      <source
        media="(min-width: 768px) and (max-width: 1023px), (min-width: 768px) and (orientation: portrait)"
        srcSet="/768-340.png"
      />
      
      {/* Mobile Landscape - 480px to 767px, landscape orientation */}
      <source
        media="(min-width: 480px) and (max-width: 767px) and (orientation: landscape)"
        srcSet="/480-160.png"
      />
      
      {/* Mobile Portrait - Default for mobile portrait and smaller screens */}
      <source
        media="(max-width: 479px), (max-width: 767px) and (orientation: portrait)"
        srcSet="/320-190.png"
      />
      
      {/* Fallback image for browsers that don't support picture element */}
      <img
        src="/320-190.png"
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

