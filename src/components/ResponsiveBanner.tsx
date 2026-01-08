'use client';

export default function ResponsiveBanner() {
  // Use the same image for all screen sizes
  return (
    <img
      src="/Your paragraph text.png"
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
  );
}

