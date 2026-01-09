import { NextRequest, NextResponse } from 'next/server';

// Mark as dynamic to ensure it reads environment variables at runtime
export const dynamic = 'force-dynamic';

// Get ward configuration based on ward set identifier
const getWardConfig = (wardSet: string | null): string | null => {
  if (!wardSet) return null;

  const set = wardSet.toLowerCase().trim();

  // Check environment variables for each ward set
  // You can define these in Vercel: WARD_SET_165, WARD_SET_170, WARD_SET_168, WARD_SET_MULTIPLE
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

  return null;
};

export async function GET(request: NextRequest) {
  try {
    // Get ward set from URL parameter (e.g., ?wardSet=165, ?wardset=165, ?set=165, or ?ward=165)
    // Check all possible parameter name variations (case-insensitive)
    const searchParams = request.nextUrl.searchParams;
    
    // Get all possible parameter names (case variations)
    const wardSet = searchParams.get('wardSet') || 
                     searchParams.get('wardset') || 
                     searchParams.get('WardSet') || 
                     searchParams.get('WARDSET') ||
                     searchParams.get('set') || 
                     searchParams.get('ward');
    
    // Debug logging (remove in production if needed)
    console.log('API - wardSet parameter:', wardSet);
    console.log('API - all search params:', Object.fromEntries(searchParams.entries()));
    
    // Try to get ward config from URL parameter
    let configuredWard = getWardConfig(wardSet);
    
    // Fallback to hostname detection
    if (!configuredWard) {
      const hostname = request.headers.get('host') || request.headers.get('x-forwarded-host');
      if (hostname) {
        const host = hostname.split(':')[0].toLowerCase();
        if (host.includes('165') || host.includes('ward-165') || host.includes('ward165')) {
          configuredWard = process.env.WARD_SET_165 || '165';
        } else if (host.includes('170') || host.includes('ward-170') || host.includes('ward170')) {
          configuredWard = process.env.WARD_SET_170 || '170';
        } else if (host.includes('168') || host.includes('ward-168') || host.includes('ward168')) {
          configuredWard = process.env.WARD_SET_168 || '168';
        } else if (host.includes('multiple') || host.includes('all') || host.includes('voters')) {
          configuredWard = process.env.WARD_SET_MULTIPLE || '140,141,143,144,145,146,147,148';
        }
      }
    }
    
    // Final fallback to default CONFIGURED_WARD
    if (!configuredWard) {
      configuredWard = process.env.CONFIGURED_WARD || process.env.NEXT_PUBLIC_WARD || '140';
    }
    
    // Parse ward(s) - support both single ward and comma-separated list
    const wards = configuredWard.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    if (wards.length === 0) {
      return NextResponse.json(
        { error: 'No ward configured. Please set WARD_SET_* environment variables or use ?wardSet= parameter in URL.' },
        { status: 500 }
      );
    }

    // Return all configured wards
    // If single ward: skip selection, use it directly
    // If multiple wards: show selection UI with only these wards
    return NextResponse.json({
      success: true,
      ward: wards[0], // Default/active ward (first one)
      allWards: wards, // All configured wards
      isMultiple: wards.length > 1, // Flag to indicate if multiple wards are configured
      wardSet: wardSet, // Return which ward set was used
      configuredWard: configuredWard, // Debug: show which config was selected
    });
  } catch (error: any) {
    console.error('Error getting configured ward:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

