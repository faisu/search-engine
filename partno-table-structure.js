/**
 * PartNo Table Structure
 * 
 * This file documents the structure and usage of the PartNo table
 * which maps ward numbers to part/booth numbers for the voter database.
 */

/**
 * PartNo Table Schema
 * 
 * Table Name: "PartNo" (case-sensitive, double-quoted in PostgreSQL)
 * Schema: public
 * 
 * Columns:
 * - part_no (string/number): The part/booth number (e.g., "163", "159")
 * - ward_no (string/number): The ward number (e.g., "140", "141", "143", "144", "145", "146", "147", "148")
 * - booth_name (string, optional): Name of the polling booth/station
 * 
 * Example Data:
 * {
 *   part_no: "163",
 *   ward_no: "146",
 *   booth_name: "Some Polling Station Name"
 * }
 */

/**
 * Valid Ward Numbers
 * These are the valid wards for Anushakti Nagar (172) constituency
 */
const VALID_WARDS = ['140', '141', '143', '144', '145', '146', '147', '148'];

/**
 * Example SQL Queries
 */

// Get all part numbers for a specific ward
const GET_PARTS_BY_WARD = `
  SELECT part_no, ward_no, booth_name
  FROM "PartNo"
  WHERE ward_no = $1
  ORDER BY part_no ASC;
`;

// Get ward number for a specific part number
const GET_WARD_BY_PART = `
  SELECT ward_no, booth_name
  FROM "PartNo"
  WHERE part_no = $1
  LIMIT 1;
`;

// Check if a part_no belongs to a specific ward
const CHECK_PART_IN_WARD = `
  SELECT EXISTS(
    SELECT 1 FROM "PartNo"
    WHERE part_no = $1 AND ward_no = $2
  ) as exists;
`;

// Get all part numbers for multiple wards
const GET_PARTS_BY_WARDS = `
  SELECT part_no, ward_no, booth_name
  FROM "PartNo"
  WHERE ward_no IN ($1, $2, $3, $4, $5, $6, $7, $8)
  ORDER BY ward_no ASC, part_no ASC;
`;

/**
 * Usage in Voter Queries
 * 
 * The PartNo table is used to filter voters by ward:
 * 
 * Example: Get voters for ward 146
 * SELECT * FROM "Voter"
 * WHERE part_no IN (
 *   SELECT part_no FROM "PartNo" WHERE ward_no = '146'
 * );
 */

/**
 * Table Relationships
 * 
 * PartNo (part_no) -> Voter (part_no)
 * - One part_no can have many voters
 * - PartNo table acts as a lookup/mapping table
 * 
 * PartNo (ward_no) -> Ward Selection
 * - Maps to valid ward numbers in the application
 */

/**
 * Example JavaScript Usage
 */

// Example: Get all part numbers for ward 146
async function getPartsForWard(wardNo) {
  const query = `
    SELECT part_no, ward_no, booth_name
    FROM "PartNo"
    WHERE ward_no = $1
    ORDER BY part_no ASC;
  `;
  // Execute query with [wardNo] as parameters
  // Returns: [{ part_no: "163", ward_no: "146", booth_name: "..." }, ...]
}

// Example: Validate if a part_no belongs to a ward
async function validatePartInWard(partNo, wardNo) {
  const query = `
    SELECT EXISTS(
      SELECT 1 FROM "PartNo"
      WHERE part_no = $1 AND ward_no = $2
    ) as exists;
  `;
  // Execute query with [partNo, wardNo] as parameters
  // Returns: [{ exists: true }] or [{ exists: false }]
}

// Example: Get ward number for a part number
async function getWardForPart(partNo) {
  const query = `
    SELECT ward_no, booth_name
    FROM "PartNo"
    WHERE part_no = $1
    LIMIT 1;
  `;
  // Execute query with [partNo] as parameters
  // Returns: [{ ward_no: "146", booth_name: "..." }] or []
}

/**
 * Export for use in other files
 */
module.exports = {
  VALID_WARDS,
  GET_PARTS_BY_WARD,
  GET_WARD_BY_PART,
  CHECK_PART_IN_WARD,
  GET_PARTS_BY_WARDS,
  getPartsForWard,
  validatePartInWard,
  getWardForPart,
};

/**
 * Demo/Test function - runs when file is executed directly
 */
if (require.main === module) {
  console.log('='.repeat(80));
  console.log('PartNo Table Structure Documentation');
  console.log('='.repeat(80));
  console.log('\n📋 Table Schema:');
  console.log('   Table Name: "PartNo" (case-sensitive)');
  console.log('   Schema: public');
  console.log('\n📊 Columns:');
  console.log('   - part_no (string/number): Part/booth number (e.g., "163", "159")');
  console.log('   - ward_no (string/number): Ward number (e.g., "140", "146")');
  console.log('   - booth_name (string, optional): Polling booth/station name');
  
  console.log('\n📋 Table Structure View:');
  console.log('┌──────────┬──────────┬─────────────────────────────────────┐');
  console.log('│ part_no  │ ward_no  │ booth_name                          │');
  console.log('├──────────┼──────────┼─────────────────────────────────────┤');
  console.log('│ 163      │ 146      │ Polling Station Name (optional)     │');
  console.log('│ 159      │ 146      │ Another Polling Station            │');
  console.log('│ 164      │ 145      │ Ward 145 Polling Station            │');
  console.log('│ 165      │ 145      │ Another Station Name                │');
  console.log('│ ...      │ ...      │ ...                                 │');
  console.log('└──────────┴──────────┴─────────────────────────────────────┘');
  
  console.log('\n📋 Column Details Table:');
  console.log('┌──────────────┬──────────────┬──────────────┬──────────────────────────────┐');
  console.log('│ Column Name  │ Data Type    │ Nullable     │ Description                  │');
  console.log('├──────────────┼──────────────┼──────────────┼──────────────────────────────┤');
  console.log('│ part_no      │ VARCHAR/INT  │ NOT NULL     │ Part/Booth number            │');
  console.log('│ ward_no      │ VARCHAR/INT  │ NOT NULL     │ Ward number (140-148)        │');
  console.log('│ booth_name   │ VARCHAR      │ NULL         │ Polling booth name           │');
  console.log('└──────────────┴──────────────┴──────────────┴──────────────────────────────┘');
  
  console.log('\n✅ Valid Ward Numbers:');
  console.log('┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐');
  console.log('│  140    │  141    │  143    │  144    │  145    │  146    │  147    │  148    │');
  console.log('└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘');
  
  console.log('\n📝 Example SQL Queries:');
  console.log('\n1. Get all parts for a ward:');
  console.log(GET_PARTS_BY_WARD);
  console.log('\n2. Get ward for a part number:');
  console.log(GET_WARD_BY_PART);
  console.log('\n3. Check if part belongs to ward:');
  console.log(CHECK_PART_IN_WARD);
  
  console.log('\n💡 Usage:');
  console.log('   const { VALID_WARDS, GET_PARTS_BY_WARD } = require("./partno-table-structure");');
  console.log('\n' + '='.repeat(80));
}

