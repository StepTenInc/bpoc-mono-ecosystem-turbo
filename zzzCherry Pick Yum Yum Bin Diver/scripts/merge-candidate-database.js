#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * BPOC Candidate Database Merger & Cleaner
 *
 * Merges 3 CSVs into one master database:
 * - All Candidates Database - ShoreAgents.csv (17K records)
 * - All Candidates Database - Jobs360.csv (2K records)
 * - ClickUp - Talent Pool.csv (5K records)
 *
 * Features:
 * - Removes Indeed.com emails
 * - Proper capitalization
 * - No duplicates
 * - Clean spacing
 * - Standardized columns
 */

const inputDir = '/Users/stepten/Desktop/Dev Projects/bpoc-stepten/public/Candidate Database';
const outputFile = '/Users/stepten/Desktop/Dev Projects/bpoc-stepten/public/MASTER_CANDIDATE_DATABASE.csv';

console.log('🔥 BPOC CANDIDATE DATABASE MERGER\n');
console.log('Processing 24,000+ candidates...\n');

// Master schema
const SCHEMA = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  current_salary: '',
  expected_salary: '',
  resume_url: '',
  profile_picture_url: '',
  clickup_url: '',
  source: '' // 'ShoreAgents', 'Jobs360', or 'ClickUp'
};

const masterDatabase = new Map(); // Use email as key to prevent duplicates
let stats = {
  totalProcessed: 0,
  indeedFiltered: 0,
  duplicates: 0,
  invalid: 0,
  cleaned: 0
};

/**
 * Clean and capitalize name
 */
function cleanName(name) {
  if (!name || typeof name !== 'string') return '';

  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Clean email
 */
function cleanEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Check if email is from Indeed
 */
function isIndeedEmail(email) {
  return email.includes('@indeed.com') ||
         email.includes('@indeedemail.com') ||
         email.includes('@indeed.') ||
         email.includes('indeed.apply') ||
         email.includes('indeedemail');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Parse CSV line (handles quoted values)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Remove any remaining quotes and trim
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  // Remove any remaining quotes and trim
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

/**
 * Parse CSV file
 */
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Process ShoreAgents CSV
 */
function processShoreAgents() {
  console.log('📂 Processing ShoreAgents CSV...');
  const filepath = path.join(inputDir, 'All Candidates Database - ShoreAgents.csv');
  const rows = parseCSV(filepath);

  let processed = 0;

  rows.forEach(row => {
    stats.totalProcessed++;

    const email = cleanEmail(row['Email'] || row['email']);

    // Validate email
    if (!email || !isValidEmail(email)) {
      stats.invalid++;
      return;
    }

    // Filter Indeed emails
    if (isIndeedEmail(email)) {
      stats.indeedFiltered++;
      return;
    }

    // Check duplicate
    if (masterDatabase.has(email)) {
      stats.duplicates++;
      return;
    }

    // Create clean record
    const record = {
      first_name: cleanName(row['First name'] || row['First Name']),
      last_name: cleanName(row['Last name'] || row['Last Name']),
      email: email,
      phone: '',
      city: '',
      current_salary: '',
      expected_salary: '',
      resume_url: '',
      profile_picture_url: '',
      clickup_url: '',
      source: 'ShoreAgents'
    };

    masterDatabase.set(email, record);
    processed++;
  });

  console.log(`✅ Processed ${processed} from ShoreAgents\n`);
}

/**
 * Process Jobs360 CSV
 */
function processJobs360() {
  console.log('📂 Processing Jobs360 CSV...');
  const filepath = path.join(inputDir, 'All Candidates Database - Jobs360.csv');
  const rows = parseCSV(filepath);

  let processed = 0;

  rows.forEach(row => {
    stats.totalProcessed++;

    const email = cleanEmail(row['Email'] || row['email']);

    // Validate email
    if (!email || !isValidEmail(email)) {
      stats.invalid++;
      return;
    }

    // Filter Indeed emails (Jobs360 likely has many)
    if (isIndeedEmail(email)) {
      stats.indeedFiltered++;
      return;
    }

    // Check duplicate
    if (masterDatabase.has(email)) {
      stats.duplicates++;
      return;
    }

    // Create clean record
    const record = {
      first_name: cleanName(row['First Name'] || row['First name']),
      last_name: cleanName(row['Last Name'] || row['Last name']),
      email: email,
      phone: '',
      city: '',
      current_salary: '',
      expected_salary: '',
      resume_url: '',
      profile_picture_url: '',
      clickup_url: '',
      source: 'Jobs360'
    };

    masterDatabase.set(email, record);
    processed++;
  });

  console.log(`✅ Processed ${processed} from Jobs360\n`);
}

/**
 * Process ClickUp CSV
 */
function processClickUp() {
  console.log('📂 Processing ClickUp CSV...');
  const filepath = path.join(inputDir, 'ClickUp - Talent Pool.csv');
  const rows = parseCSV(filepath);

  let processed = 0;

  rows.forEach(row => {
    stats.totalProcessed++;

    const email = cleanEmail(row['Email'] || row['email']);

    // Validate email
    if (!email || !isValidEmail(email)) {
      stats.invalid++;
      return;
    }

    // Filter Indeed emails
    if (isIndeedEmail(email)) {
      stats.indeedFiltered++;
      return;
    }

    // Parse name (ClickUp has "Name" field combined)
    const fullName = row['Name'] || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check duplicate (but update with ClickUp data if it has more info)
    if (masterDatabase.has(email)) {
      stats.duplicates++;

      // Update existing record with ClickUp data if available
      const existing = masterDatabase.get(email);

      if (row['Phone'] && !existing.phone) existing.phone = row['Phone'].trim();
      if (row['City'] && !existing.city) existing.city = row['City'].trim();
      if (row['Current Salary'] && !existing.current_salary) existing.current_salary = row['Current Salary'].trim();
      if (row['Expected Monthly Salary'] && !existing.expected_salary) existing.expected_salary = row['Expected Monthly Salary'].trim();
      if (row['Resume'] && !existing.resume_url) existing.resume_url = row['Resume'].trim();
      if (row['Profile Picture'] && !existing.profile_picture_url) existing.profile_picture_url = row['Profile Picture'].trim();

      // Mark source as ClickUp if it has more data
      existing.source = 'ClickUp';

      return;
    }

    // Create clean record
    const record = {
      first_name: cleanName(firstName),
      last_name: cleanName(lastName),
      email: email,
      phone: (row['Phone'] || '').trim(),
      city: (row['City'] || '').trim(),
      current_salary: (row['Current Salary'] || '').trim(),
      expected_salary: (row['Expected Monthly Salary'] || row['Expected Monthly Salary '] || '').trim(),
      resume_url: (row['Resume'] || '').trim(),
      profile_picture_url: (row['Profile Picture'] || '').trim(),
      clickup_url: '', // Could add if available
      source: 'ClickUp'
    };

    masterDatabase.set(email, record);
    processed++;
  });

  console.log(`✅ Processed ${processed} from ClickUp\n`);
}

/**
 * Export to CSV
 */
function exportToCSV() {
  console.log('💾 Exporting master database...');

  const headers = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'city',
    'current_salary',
    'expected_salary',
    'resume_url',
    'profile_picture_url',
    'clickup_url',
    'source'
  ];

  let csv = headers.join(',') + '\n';

  masterDatabase.forEach(record => {
    const row = headers.map(header => {
      const value = record[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
      }
      return value;
    });
    csv += row.join(',') + '\n';
  });

  fs.writeFileSync(outputFile, csv);
  stats.cleaned = masterDatabase.size;

  console.log(`✅ Exported to: ${outputFile}\n`);
}

/**
 * Print final stats
 */
function printStats() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FINAL STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Processed:       ${stats.totalProcessed.toLocaleString()}`);
  console.log(`Indeed Emails Filtered: ${stats.indeedFiltered.toLocaleString()}`);
  console.log(`Invalid Emails:        ${stats.invalid.toLocaleString()}`);
  console.log(`Duplicates Removed:    ${stats.duplicates.toLocaleString()}`);
  console.log('');
  console.log(`✅ CLEAN RECORDS:      ${stats.cleaned.toLocaleString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Breakdown by source
  const bySource = {
    ShoreAgents: 0,
    Jobs360: 0,
    ClickUp: 0
  };

  masterDatabase.forEach(record => {
    bySource[record.source]++;
  });

  console.log('📦 BY SOURCE:');
  console.log(`   ShoreAgents: ${bySource.ShoreAgents.toLocaleString()}`);
  console.log(`   Jobs360:     ${bySource.Jobs360.toLocaleString()}`);
  console.log(`   ClickUp:     ${bySource.ClickUp.toLocaleString()}`);
  console.log('');

  // Extra data available
  let withPhone = 0;
  let withCity = 0;
  let withSalary = 0;
  let withResume = 0;
  let withPhoto = 0;

  masterDatabase.forEach(record => {
    if (record.phone) withPhone++;
    if (record.city) withCity++;
    if (record.current_salary || record.expected_salary) withSalary++;
    if (record.resume_url) withResume++;
    if (record.profile_picture_url) withPhoto++;
  });

  console.log('📋 EXTRA DATA AVAILABLE:');
  console.log(`   With Phone:           ${withPhone.toLocaleString()} (${((withPhone/stats.cleaned)*100).toFixed(1)}%)`);
  console.log(`   With City:            ${withCity.toLocaleString()} (${((withCity/stats.cleaned)*100).toFixed(1)}%)`);
  console.log(`   With Salary Info:     ${withSalary.toLocaleString()} (${((withSalary/stats.cleaned)*100).toFixed(1)}%)`);
  console.log(`   With Resume:          ${withResume.toLocaleString()} (${((withResume/stats.cleaned)*100).toFixed(1)}%)`);
  console.log(`   With Profile Picture: ${withPhoto.toLocaleString()} (${((withPhoto/stats.cleaned)*100).toFixed(1)}%)`);
  console.log('');
}

/**
 * Main execution
 */
function main() {
  try {
    processShoreAgents();
    processJobs360();
    processClickUp();
    exportToCSV();
    printStats();

    console.log('🎉 SUCCESS! Master database created!');
    console.log(`📁 File: ${outputFile}`);
    console.log('');
    console.log('✅ Ready to import into BPOC outbound system!');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Run it!
main();
