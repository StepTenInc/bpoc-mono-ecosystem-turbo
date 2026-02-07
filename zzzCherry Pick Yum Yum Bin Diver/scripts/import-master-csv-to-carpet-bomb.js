#!/usr/bin/env node

/**
 * Import MASTER_CANDIDATE_DATABASE.csv into carpet_bomb_leads table
 * Run AFTER executing the carpet bomb migration SQL
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const csvFile = '/Users/stepten/Desktop/Dev Projects/bpoc-stepten/public/MASTER_CANDIDATE_DATABASE.csv';

console.log('🚀 IMPORTING MASTER CSV TO CARPET BOMB LEADS\n');

/**
 * Parse CSV line (handles quoted values)
 */
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
    // Read CSV
    const content = fs.readFileSync(csvFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    console.log(`📂 Found ${lines.length - 1} leads to import\n`);

    // Parse header
    const headers = parseCSVLine(lines[0]);
    console.log('📋 Columns:', headers.join(', '));
    console.log('');

    // Prepare batch insert
    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      const lead = {
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
      };

      if (lead.email) {
        leads.push(lead);
      }
    }

    console.log(`✅ Parsed ${leads.length} valid leads`);
    console.log('');

    // Import in batches
    const batchSize = 500;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);

      try {
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
          errors += batch.length;
        } else {
          imported += batch.length;
          console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leads.length / batchSize)}: ${batch.length} leads imported`);
        }
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
        errors += batch.length;
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IMPORT COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Imported: ${imported.toLocaleString()}`);
    console.log(`❌ Errors: ${errors.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 Next: Go to /admin/carpet-bomb to view your leads!');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

importCSV();
