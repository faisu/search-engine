import VoterSearchForm from '@/components/VoterSearchForm';
import Image from 'next/image';
import ResponsiveBanner from '@/components/ResponsiveBanner';

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Hide all sidebars on all screen sizes */
          .desktop-image-container,
          .desktop-bg-overlay,
          .tablet-image-container,
          .tablet-bg-overlay,
          .mobile-image-container,
          .mobile-bg-overlay {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
          }
          /* Banner navbar positioning - starts at top */
          .banner-navbar {
            top: 0 !important; /* At the very top of the page */
            width: 100% !important;
            max-width: 100% !important;
            left: 0 !important;
            right: 0 !important;
          }
          .banner-navbar picture,
          .banner-navbar img {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            object-fit: cover !important;
            display: block !important;
          }
          /* Force image reload on resize */
          .banner-navbar img {
            image-rendering: auto;
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
          /* Content padding - only banner navbar (33vh) */
          .content-wrapper {
            padding-top: calc(33vh + 20px) !important; /* Banner navbar (33vh) + spacing (20px) */
            padding-left: 0 !important; /* No sidebar on any screen */
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
          }
        `
      }} />
      <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-purple-50 relative overflow-x-hidden" style={{ overflowY: 'auto' }}>
      {/* Background with blurred effect */}
      <div className="fixed inset-0 bg-[url('/campaign-image.jpeg')] bg-cover bg-center opacity-20 blur-2xl -z-10"></div>
      
      {/* Banner Navbar - For marketing banner image (dimensions to be provided by graphics team) */}
      {/* Current height: 33vh (1/3 of screen height) - Update this when graphics team provides image */}
      <div className="banner-navbar fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-md border-b-2 border-pink-300" style={{ height: '33vh', boxSizing: 'border-box', maxWidth: '100%' }}>
        <div className="relative w-full h-full overflow-hidden" style={{ width: '100%', height: '100%' }}>
          {/* Responsive banner images - sm (mobile), md (tablet), lg (desktop) */}
          <ResponsiveBanner />
        </div>
      </div>


      {/* Content - Responsive padding for all screen sizes */}
      <div className="content-wrapper relative z-10 pb-6 sm:pb-8" style={{ 
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

