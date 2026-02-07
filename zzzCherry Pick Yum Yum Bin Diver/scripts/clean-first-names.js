#!/usr/bin/env node

const SUPABASE_URL = 'https://ayrdnsiaylomcemfdisr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5cmRuc2lheWxvbWNlbWZkaXNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzE2MTg5NiwiZXhwIjoyMDY4NzM3ODk2fQ.QZDdX7RJQoDJFy3L1_-8xlXIBBrirtlgMwfQZPnFU3A';

console.log('🧹 CLEANING FIRST NAMES TO SINGLE WORD\n');
console.log('Examples:');
console.log('  "Angela Pila Empirantes" → "Angela"');
console.log('  "Maureen Claire" → "Maureen"');
console.log('  "Mary-Jane" → "Mary-Jane" (hyphenated kept)\n');

async function cleanFirstNames() {
  try {
    // Get all leads with multi-word first names
    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/carpet_bomb_leads?select=id,first_name&first_name=like.*%20*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!fetchResponse.ok) {
      throw new Error('Failed to fetch leads');
    }

    const leads = await fetchResponse.json();
    console.log(`📊 Found ${leads.length} leads with multi-word first names\n`);

    if (leads.length === 0) {
      console.log('✅ All first names are already single words!');
      return;
    }

    // Show examples
    console.log('Examples of what will be cleaned:');
    leads.slice(0, 10).forEach(lead => {
      const cleaned = lead.first_name.trim().split(' ')[0];
      console.log(`  "${lead.first_name}" → "${cleaned}"`);
    });
    console.log('');

    // Update each lead
    let updated = 0;
    for (const lead of leads) {
      const cleanedName = lead.first_name.trim().split(' ')[0];

      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/carpet_bomb_leads?id=eq.${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ first_name: cleanedName }),
      });

      if (updateResponse.ok) {
        updated++;
        if (updated % 100 === 0) {
          console.log(`✅ Updated ${updated}/${leads.length} leads...`);
        }
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ CLEANED ${updated.toLocaleString()} FIRST NAMES`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 All first names are now single words!');

  } catch (error) {
    console.error('❌ Cleaning failed:', error.message);
    process.exit(1);
  }
}

cleanFirstNames();
