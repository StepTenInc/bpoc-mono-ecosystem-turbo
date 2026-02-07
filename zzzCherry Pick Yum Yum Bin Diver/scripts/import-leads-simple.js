#!/usr/bin/env node

const fs = require('fs');

// Hardcoded credentials (from your .env.local)
const SUPABASE_URL = 'https://ayrdnsiaylomcemfdisr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmRuc2lheWxvbWNlbWZkaXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE2MTg5NiwiZXhwIjoyMDY4NzM3ODk2fQ.QZDdX7RJQoDJFy3L1_-8xlXIBBrirtlgMwfQZPnFU3A';

const csvFile = '/Users/stepten/Desktop/Dev Projects/bpoc-stepten/public/MASTER_CANDIDATE_DATABASE.csv';

console.log('🚀 IMPORTING 23,132 LEADS TO CARPET_BOMB_LEADS\n');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

async function importCSV() {
  try {
    const content = fs.readFileSync(csvFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`📂 Found ${lines.length - 1} leads\n`);

    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      leads.push({
        first_name: values[0] || null,
        last_name: values[1] || null,
        email: values[2]?.toLowerCase().trim() || null,
        phone_number: values[3] || null,
        city: values[4] || null,
        current_salary: values[5] || null,
        expected_salary: values[6] || null,
        resume_url: values[7] || null,
        profile_picture_url: values[8] || null,
        clickup_url: values[9] || null,
        original_source: values[10] || 'Master CSV Import',
      });
    }

    console.log(`✅ Parsed ${leads.length} leads`);
    console.log('📤 Importing in batches...\n');

    const batchSize = 500;
    let imported = 0;

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/carpet_bomb_leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'resolution=ignore-duplicates',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, errorText);
      } else {
        imported += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)}: ${batch.length} leads imported`);
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ IMPORTED ${imported.toLocaleString()} LEADS`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 Check Supabase: carpet_bomb_leads table should have 23,132 rows');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importCSV();
