import { NextResponse } from 'next/server';

// Mark as dynamic to ensure it reads environment variables at runtime
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get ward from environment variable
    // Can be a single ward (e.g., "140") or comma-separated list (e.g., "140,141,143")
    const configuredWard = process.env.CONFIGURED_WARD || process.env.NEXT_PUBLIC_WARD || '140';
    
    // Parse ward(s) - support both single ward and comma-separated list
    const wards = configuredWard.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    if (wards.length === 0) {
      return NextResponse.json(
        { error: 'No ward configured. Please set CONFIGURED_WARD environment variable.' },
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
    });
  } catch (error: any) {
    console.error('Error getting configured ward:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

