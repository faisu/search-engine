import VoterSearchForm from '@/components/VoterSearchForm';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (max-width: 767px) {
            .tablet-image-container,
            .desktop-image-container,
            .tablet-bg-overlay,
            .desktop-bg-overlay {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
              opacity: 0 !important;
            }
          }
          @media (min-width: 768px) and (max-width: 1023px) {
            .desktop-image-container,
            .desktop-bg-overlay {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
              opacity: 0 !important;
            }
          }
          /* Ensure content doesn't render behind fixed images */
          .content-wrapper {
            isolation: isolate;
            position: relative;
          }
          .content-wrapper > * {
            position: relative;
            z-index: 1;
          }
          /* Prevent content from scrolling into image areas */
          @media (max-width: 639px) {
            .content-wrapper {
              margin-top: 0 !important;
              padding-top: 280px !important;
            }
          }
          /* Add more space at 640px-720px width */
          @media (min-width: 640px) and (max-width: 720px) {
            .content-wrapper {
              padding-top: 320px !important;
            }
          }
          @media (max-width: 767px) {
            body {
              overflow-x: hidden;
            }
            /* Ensure fixed elements stay on top and are opaque */
            [class*="fixed"] {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            /* Mobile image - attached right at navbar bottom (no gap) */
            .mobile-image-container {
              top: 48px !important; /* Match navbar height exactly */
            }
            .mobile-bg-overlay {
              top: 48px !important; /* Match navbar height exactly */
            }
            @media (min-width: 640px) {
              .mobile-image-container {
                top: 60px !important; /* Match navbar height on sm */
              }
              .mobile-bg-overlay {
                top: 60px !important; /* Match navbar height on sm */
              }
            }
          }
          /* Add bottom margin to tablet image container at 640px-720px */
          @media (min-width: 640px) and (max-width: 720px) {
            .tablet-image-container > div {
              margin-bottom: 10px !important;
            }
          }
        `
      }} />
      <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-purple-50 relative overflow-x-hidden" style={{ overflowY: 'auto' }}>
      {/* Background with blurred effect */}
      <div className="fixed inset-0 bg-[url('/campaign-image.jpeg')] bg-cover bg-center opacity-20 blur-2xl -z-10"></div>
      
      {/* Fixed Marketing Banner - Always Visible, Compact & Attractive */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-pink-500 via-magenta-500 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white text-sm sm:text-base md:text-lg font-bold font-devanagari tracking-wide">
                राष्ट्रवादी कांग्रेस पार्टी
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 bg-white/20 rounded-full px-2 py-1">
                <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full"></div>
                <span className="text-white text-xs font-semibold">Live</span>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background overlays to prevent content showing behind images - Must be above content but below images */}
      {/* Mobile: Background above content area - covers entire top section */}
      {/* Navbar height: py-2 (8px) + content (~44px) + py-2 (8px) = ~60px, py-2.5 (10px) + content (~52px) + py-2.5 (10px) = ~72px on sm */}
      <div className="mobile-bg-overlay fixed left-0 right-0 z-35 md:hidden bg-white" style={{ height: '192px' }}></div>
      
      {/* Tablet: Background on left side - full height coverage */}
      <div className="tablet-bg-overlay hidden md:block lg:hidden fixed left-0 bottom-0 z-35 bg-white" style={{ width: '160px', maxWidth: '160px', height: '100%', top: '0px' }}></div>
      
      {/* Desktop: Background on left side - full height coverage */}
      <div className="desktop-bg-overlay hidden lg:block fixed left-0 bottom-0 z-35 bg-white" style={{ width: '320px', maxWidth: '320px', height: '100%', top: '0px' }}></div>

      {/* Fixed Campaign Image - Responsive for Mobile, Tablet, Laptop */}
      {/* Mobile: Fixed at top, full width - starts right below navbar (no gap) */}
      {/* Navbar height: py-2 (8px) + content (~44px) + py-2 (8px) = ~60px, py-2.5 (10px) + content (~52px) + py-2.5 (10px) = ~72px on sm */}
      <div className="mobile-image-container fixed left-0 right-0 z-40 md:hidden bg-white shadow-lg">
        <div className="relative w-full h-48 sm:h-56 overflow-hidden ring-2 ring-pink-300 bg-white px-2 py-2">
          <Image
            src="/campaign-image.jpeg"
            alt="Campaign"
            width={600}
            height={300}
            className="w-full h-full object-contain rounded-lg"
            priority
            sizes="100vw"
          />
        </div>
      </div>

      {/* Tablet: Fixed on left, medium size */}
      <div className="tablet-image-container hidden md:block lg:hidden fixed left-0 bottom-0 z-40 bg-white" style={{ width: '160px', maxWidth: '160px', boxSizing: 'border-box', top: '0px' }}>
        <div className="relative h-full w-full shadow-2xl ring-4 ring-pink-300 bg-white" style={{ overflow: 'hidden', width: '100%', height: '100%', boxSizing: 'border-box', padding: '8px' }}>
          <Image
            src="/campaign-image.jpeg"
            alt="Campaign"
            width={300}
            height={800}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            priority
            sizes="160px"
          />
        </div>
      </div>

      {/* Laptop/Desktop: Fixed on left, larger size */}
      <div className="desktop-image-container hidden lg:block fixed left-0 bottom-0 z-40 bg-white" style={{ width: '320px', maxWidth: '320px', boxSizing: 'border-box', top: '0px' }}>
        <div className="relative h-full w-full shadow-2xl ring-4 ring-pink-300 bg-white" style={{ overflow: 'hidden', width: '100%', height: '100%', boxSizing: 'border-box', padding: '16px' }}>
          <Image
            src="/campaign-image.jpeg"
            alt="Campaign"
            width={400}
            height={800}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            priority
            sizes="240px"
          />
        </div>
      </div>

      {/* Content - Responsive padding for all screen sizes */}
      <div className="content-wrapper relative z-10 pt-[280px] sm:pt-[300px] md:pt-24 md:pl-[176px] lg:pt-28 lg:pl-[336px] xl:pt-32 pb-6 sm:pb-8" style={{ 
        width: '100%', 
        maxWidth: '100vw', 
        boxSizing: 'border-box', 
        overflowX: 'hidden',
        minHeight: '100vh',
        position: 'relative'
      }}>
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0" style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          {/* Header Section */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 px-2 sm:px-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 tracking-tight leading-tight sm:leading-snug md:leading-normal">
              Welcome to Voter Search Platform
            </h1>
          </div>

          {/* Voter Search Form - Scrollable */}
          <VoterSearchForm />
        </div>
      </div>
    </main>
    </>
  );
}

