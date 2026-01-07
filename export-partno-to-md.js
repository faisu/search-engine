const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_3ReFIJC9cGXy@ep-dark-bird-adq3eh0o-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

/**
 * Export PartNo table data to Markdown file
 */
async function exportPartNoToMarkdown() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Query all PartNo data
    const query = `
      SELECT part_no, ward_no, booth_name
      FROM "PartNo"
      ORDER BY ward_no ASC, part_no ASC;
    `;

    const result = await client.query(query);
    const rows = result.rows;

    if (rows.length === 0) {
      console.log('❌ No data found in PartNo table');
      return;
    }

    console.log(`📊 Found ${rows.length} records in PartNo table\n`);

    // Generate Markdown content
    let markdown = '# PartNo Table Data\n\n';
    markdown += `**Total Records:** ${rows.length}\n\n`;
    markdown += `**Export Date:** ${new Date().toISOString()}\n\n`;
    markdown += '---\n\n';

    // Group by ward for better organization
    const groupedByWard = {};
    rows.forEach(row => {
      const ward = row.ward_no;
      if (!groupedByWard[ward]) {
        groupedByWard[ward] = [];
      }
      groupedByWard[ward].push(row);
    });

    // Generate summary table
    markdown += '## Summary by Ward\n\n';
    markdown += '| Ward No | Part Count |\n';
    markdown += '|---------|------------|\n';
    Object.keys(groupedByWard).sort().forEach(ward => {
      markdown += `| ${ward} | ${groupedByWard[ward].length} |\n`;
    });
    markdown += '\n---\n\n';

    // Generate full data table
    markdown += '## Full Table Data\n\n';
    markdown += '| part_no | ward_no | booth_name |\n';
    markdown += '|---------|---------|------------|\n';
    
    rows.forEach(row => {
      const partNo = row.part_no || '-';
      const wardNo = row.ward_no || '-';
      const boothName = (row.booth_name || '-').replace(/\|/g, '\\|'); // Escape pipe characters
      markdown += `| ${partNo} | ${wardNo} | ${boothName} |\n`;
    });

    markdown += '\n---\n\n';

    // Generate data grouped by ward
    markdown += '## Data Grouped by Ward\n\n';
    Object.keys(groupedByWard).sort().forEach(ward => {
      markdown += `### Ward ${ward} (${groupedByWard[ward].length} parts)\n\n`;
      markdown += '| part_no | booth_name |\n';
      markdown += '|---------|------------|\n';
      
      groupedByWard[ward].forEach(row => {
        const partNo = row.part_no || '-';
        const boothName = (row.booth_name || '-').replace(/\|/g, '\\|');
        markdown += `| ${partNo} | ${boothName} |\n`;
      });
      markdown += '\n';
    });

    // Save to file
    const filename = `partno-table-data-${new Date().toISOString().split('T')[0]}.md`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, markdown, 'utf8');
    console.log(`✅ Data exported to: ${filename}`);
    console.log(`📁 File path: ${filepath}\n`);

    // Print summary
    console.log('📊 Summary:');
    console.log(`   Total records: ${rows.length}`);
    console.log(`   Unique wards: ${Object.keys(groupedByWard).length}`);
    Object.keys(groupedByWard).sort().forEach(ward => {
      console.log(`   Ward ${ward}: ${groupedByWard[ward].length} parts`);
    });

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the export
exportPartNoToMarkdown()
  .then(() => {
    console.log('\n✨ Export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });

