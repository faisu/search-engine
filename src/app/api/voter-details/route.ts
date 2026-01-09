import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Mark as dynamic to suppress build warnings (this route uses query parameters)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const epic = searchParams.get('epic');
    const ward = searchParams.get('ward');

    // Validate inputs
    if (!epic || !ward) {
      return NextResponse.json(
        { error: 'Missing required parameters: epic, ward' },
        { status: 400 }
      );
    }

    // Validate ward against configured ward(s) from environment variable
    const configuredWard = process.env.CONFIGURED_WARD || process.env.NEXT_PUBLIC_WARD || '140';
    const validWards = configuredWard.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    if (!validWards.includes(ward)) {
      return NextResponse.json(
        { error: `Invalid ward number. Allowed ward(s): ${validWards.join(', ')}` },
        { status: 400 }
      );
    }

    // Get full voter details from single voters table
    // Convert ward to integer for comparison since ward_no is INTEGER in database
    const wardNumber = parseInt(ward, 10);
    if (isNaN(wardNumber)) {
      return NextResponse.json(
        { error: 'Invalid ward number format' },
        { status: 400 }
      );
    }

    const detailsQuery = `
      SELECT 
        epic_number,
        full_name,
        age,
        booth_no,
        sr_no,
        locality_street,
        town_village,
        gender,
        dob,
        relation_type,
        relative_full_name,
        ps_name,
        ps_address,
        ward_no
      FROM voters
      WHERE epic_number = $1
        AND ward_no = $2
      LIMIT 1;
    `;

    const result = await query(detailsQuery, [epic, wardNumber]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Voter not found' },
        { status: 404 }
      );
    }

    const voter = result.rows[0];

    // Extract polling station name and address directly from voters table
    const pollingStationName = voter.ps_name || `Booth ${voter.booth_no}`;
    const pollingStationAddress = voter.ps_address || voter.locality_street || voter.town_village || 'Address not available';
    const fullAddress = [voter.locality_street, voter.town_village].filter(Boolean).join(', ') || null;

    // Format response
    const voterDetails = {
      epic: voter.epic_number,
      name: voter.full_name,
      age: voter.age || null,
      ward: voter.ward_no || ward, // Use ward_no from table or fallback to request parameter
      sr_no: voter.sr_no || null,
      partBooth: `${voter.booth_no}`, // Show booth number
      address: fullAddress,
      house_number: null, // Not in new schema
      pincode: null, // Not in new schema
      gender: voter.gender || null,
      ac_no: null, // Not in new schema
      relation_name: voter.relative_full_name || null,
      relation_type: voter.relation_type || null,
      pollingStation: pollingStationName,
      pollingAddress: pollingStationAddress,
    };

    return NextResponse.json({
      success: true,
      voter: voterDetails,
    });

  } catch (error: any) {
    console.error('Get voter details error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

