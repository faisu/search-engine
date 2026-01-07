const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_3ReFIJC9cGXy@ep-dark-bird-adq3eh0o-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: connectionString,
});

// Array to store all output lines
let outputLines = [];

// Helper function to add output (both console and array)
function addOutput(message) {
  console.log(message);
  outputLines.push(message);
}

async function getVotersByWard(wardNo) {
  try {
    await client.connect();
    addOutput(`# Voters for Ward ${wardNo}\n`);
    addOutput('✅ Connected to database\n\n');

    // Step 1: Get all part_no values for the selected ward from PartNo table
    addOutput(`## Step 1: Getting Part Numbers for Ward ${wardNo}\n`);
    addOutput('='.repeat(80) + '\n');
    
    const partNoQuery = `
      SELECT part_no, ward_no, booth_name
      FROM "PartNo"
      WHERE ward_no = $1
      ORDER BY part_no ASC;
    `;
    
    const partNoResult = await client.query(partNoQuery, [wardNo]);
    
    if (partNoResult.rows.length === 0) {
      addOutput(`❌ No part numbers found for ward ${wardNo}\n`);
      return;
    }
    
    addOutput(`✅ Found ${partNoResult.rows.length} part numbers for ward ${wardNo}:\n`);
    
    // Extract part_no values
    const partNumbers = partNoResult.rows.map(row => row.part_no);
    
    addOutput('\n### Part Numbers List:\n');
    addOutput('| Part No | Ward No | Booth Name |\n');
    addOutput('|---------|---------|------------|\n');
    partNoResult.rows.forEach(row => {
      const boothName = (row.booth_name || '-').replace(/\|/g, '\\|');
      addOutput(`| ${row.part_no} | ${row.ward_no} | ${boothName} |`);
    });
    addOutput('\n');
    
    addOutput(`\n**Part Numbers:** ${partNumbers.join(', ')}\n\n`);

    // Step 2: Get all voters from Voter table where part_no matches the part numbers from Step 1
    addOutput(`## Step 2: Getting Voters for Part Numbers\n`);
    addOutput('='.repeat(80) + '\n');
    
    // Get all voters matching part numbers from the ward
    const votersQuery = `
      SELECT 
        epic_number,
        full_name,
        age,
        part_no,
        sr_no,
        address,
        house_number,
        gender,
        mobile_no_primary,
        mobile_no_secondary
      FROM public."Voter"
      WHERE part_no in (select part_no from "PartNo" where ward_no = $1)
      ORDER BY part_no ASC, full_name ASC;
    `;
    
    const votersResult = await client.query(votersQuery, [wardNo]);
    
    addOutput(`✅ Found ${votersResult.rows.length} voters for ward ${wardNo}\n\n`);

    if (votersResult.rows.length > 0) {
      // Group voters by part_no for better organization
      const votersByPartNo = {};
      votersResult.rows.forEach(voter => {
        const partNo = voter.part_no;
        if (!votersByPartNo[partNo]) {
          votersByPartNo[partNo] = [];
        }
        votersByPartNo[partNo].push(voter);
      });

      addOutput('## Step 3: Voters Data (Grouped by Part Number)\n');
      addOutput('='.repeat(80) + '\n');

      // Display voters grouped by part_no
      Object.keys(votersByPartNo).sort().forEach(partNo => {
        const voters = votersByPartNo[partNo];
        const partInfo = partNoResult.rows.find(p => p.part_no === partNo);
        
        addOutput(`\n### Part No: ${partNo} (${voters.length} voters)`);
        if (partInfo) {
          addOutput(`**Booth Name:** ${partInfo.booth_name || 'N/A'}\n`);
        }
        addOutput('\n| EPIC | Full Name | Age | SR No | Gender | House No | Mobile Primary |\n');
        addOutput('|------|-----------|-----|-------|--------|----------|---------------|\n');
        
        voters.forEach(voter => {
          addOutput(`| ${voter.epic_number} | ${voter.full_name || '-'} | ${voter.age || '-'} | ${voter.sr_no || '-'} | ${voter.gender || '-'} | ${voter.house_number || '-'} | ${voter.mobile_no_primary || '-'} |`);
        });
        addOutput('\n');
      });

      // Summary table
      addOutput('\n## Summary Table (All Voters)\n');
      addOutput('='.repeat(80) + '\n');
      addOutput('\n| EPIC | Full Name | Age | Part No | SR No | Gender | House No | Address | Mobile Primary |\n');
      addOutput('|------|-----------|-----|---------|-------|--------|----------|---------|---------------|\n');
      
      votersResult.rows.forEach(voter => {
        const address = (voter.address || '-').replace(/\|/g, '\\|').substring(0, 50) + (voter.address && voter.address.length > 50 ? '...' : '');
        addOutput(`| ${voter.epic_number} | ${voter.full_name || '-'} | ${voter.age || '-'} | ${voter.part_no} | ${voter.sr_no || '-'} | ${voter.gender || '-'} | ${voter.house_number || '-'} | ${address} | ${voter.mobile_no_primary || '-'} |`);
      });
      addOutput('\n');

      // Statistics
      addOutput('\n## Statistics\n');
      addOutput('='.repeat(80) + '\n');
      addOutput(`- **Total Part Numbers:** ${partNumbers.length}\n`);
      addOutput(`- **Total Voters:** ${votersResult.rows.length}\n`);
      
      const votersPerPart = Object.keys(votersByPartNo).map(partNo => ({
        partNo,
        count: votersByPartNo[partNo].length
      }));
      
      addOutput('\n### Voters Count per Part Number:\n');
      addOutput('| Part No | Voter Count |\n');
      addOutput('|---------|-------------|\n');
      votersPerPart.sort((a, b) => a.partNo.localeCompare(b.partNo)).forEach(item => {
        addOutput(`| ${item.partNo} | ${item.count} |`);
      });
      addOutput('\n');

    } else {
      addOutput(`❌ No voters found for the part numbers from ward ${wardNo}\n`);
    }

    // Write to markdown file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `ward-${wardNo}-voters-${timestamp}.md`;
    const filepath = path.join(__dirname, filename);
    const outputText = outputLines.join('\n');
    
    fs.writeFileSync(filepath, outputText, 'utf8');
    addOutput(`\n✅ Output saved to: ${filename}\n`);

  } catch (error) {
    const errorMsg = `❌ Error: ${error.message}`;
    console.error(errorMsg);
    outputLines.push(errorMsg);
    
    // Save error to file too
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `ward-error-${timestamp}.md`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, outputLines.join('\n'), 'utf8');
  } finally {
    await client.end();
  }
}

// Get ward number from command line argument or use default
const wardNumber = process.argv[2] || '140';
getVotersByWard(wardNumber);

