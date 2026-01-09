// Helper function to get ward configuration from URL parameter or environment variables
// This is used by all API routes to ensure consistent ward validation

import { NextRequest } from 'next/server';

export function getWardConfigFromRequest(request: NextRequest): string {
  try {
    // Try to get ward set from URL parameter
    const searchParams = request.nextUrl.searchParams;
    const wardSet = searchParams.get('wardSet') || 
                     searchParams.get('wardset') || 
                     searchParams.get('WardSet') || 
                     searchParams.get('WARDSET') ||
                     searchParams.get('set') || 
                     searchParams.get('ward');
    
    if (wardSet) {
      const set = wardSet.toLowerCase().trim();
      
      // Check environment variables for each ward set
      if (set === '165' || set === 'ward165' || set === 'ward-165') {
        return process.env.WARD_SET_165 || '165';
      }
      if (set === '170' || set === 'ward170' || set === 'ward-170') {
        return process.env.WARD_SET_170 || '170';
      }
      if (set === '168' || set === 'ward168' || set === 'ward-168') {
        return process.env.WARD_SET_168 || '168';
      }
      if (set === 'multiple' || set === 'all' || set === 'voters' || set === 'multi') {
        return process.env.WARD_SET_MULTIPLE || '140,141,143,144,145,146,147,148';
      }
    }
    
    // Fallback to hostname detection
    const hostname = request.headers.get('host') || request.headers.get('x-forwarded-host');
    if (hostname) {
      const host = hostname.split(':')[0].toLowerCase();
      if (host.includes('165') || host.includes('ward-165') || host.includes('ward165')) {
        return process.env.WARD_SET_165 || '165';
      }
      if (host.includes('170') || host.includes('ward-170') || host.includes('ward170')) {
        return process.env.WARD_SET_170 || '170';
      }
      if (host.includes('168') || host.includes('ward-168') || host.includes('ward168')) {
        return process.env.WARD_SET_168 || '168';
      }
      if (host.includes('multiple') || host.includes('all') || host.includes('voters')) {
        return process.env.WARD_SET_MULTIPLE || '140,141,143,144,145,146,147,148';
      }
    }
    
    // Final fallback
    return process.env.CONFIGURED_WARD || process.env.NEXT_PUBLIC_WARD || '140';
  } catch (error) {
    // Fallback on error
    return process.env.CONFIGURED_WARD || process.env.NEXT_PUBLIC_WARD || '140';
  }
}

export function getValidWards(request: NextRequest): string[] {
  const configuredWard = getWardConfigFromRequest(request);
  return configuredWard.split(',').map(w => w.trim()).filter(w => w.length > 0);
}

