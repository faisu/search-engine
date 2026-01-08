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

    // Get full voter details with polling station info from PartNo table
    // Matching wtsp-gemini-bot.js logic: uses getPartDetails() which returns polling_station_name and polling_station_address
    const detailsQuery = `
      SELECT 
        v.epic_number,
        v.full_name,
        v.age,
        v.part_no,
        v.sr_no,
        v.address,
        v.house_number,
        v.gender,
        v.pincode,
        v.ac_no,
        v.relation_name,
        v.relation_type,
        p.booth_name,
        p.english_booth_address
      FROM public."Voter" v
      LEFT JOIN "PartNo" p ON v.part_no = p.part_no
      WHERE v.epic_number = $1
        AND v.part_no in (select part_no from "PartNo" where ward_no = $2)
      LIMIT 1;
    `;

    const result = await query(detailsQuery, [epic, ward]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Voter not found' },
        { status: 404 }
      );
    }

    const voter = result.rows[0];

    // Extract polling station name and address from PartNo table
    // Matching wtsp-gemini-bot.js: polling_station_name = booth_name, polling_station_address = english_booth_address
    const pollingStationName = voter.booth_name || `Part ${voter.part_no}`;
    const pollingStationAddress = voter.english_booth_address || voter.booth_name || voter.address || 'Address not available';

    // Format response
    const voterDetails = {
      epic: voter.epic_number,
      name: voter.full_name,
      age: voter.age || null,
      ward: ward, // Use the actual ward number from the request parameter
      sr_no: voter.sr_no || null,
      partBooth: `${voter.part_no}`, // Show only part number, not serial number
      address: voter.address || null,
      house_number: voter.house_number || null,
      pincode: voter.pincode || null,
      gender: voter.gender || null,
      ac_no: voter.ac_no || null,
      relation_name: voter.relation_name || null,
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

