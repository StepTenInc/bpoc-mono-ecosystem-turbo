import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV, isValidEmail as validateEmail } from '@/lib/outbound/csv-parser';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const columnMapping = JSON.parse(formData.get('column_mapping') as string || '{}');
    const skipDuplicates = formData.get('skip_duplicates') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvContent = await file.text();
    const parsed = parseCSV(csvContent);

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const errorLog: Array<{ row: number; email: string; errors: string[] }> = [];

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const rowErrors: string[] = [];

      try {
        // Map columns
        const email = row[columnMapping['email']]?.trim().toLowerCase();
        const firstName = row[columnMapping['first_name']]?.trim() || '';
        const lastName = row[columnMapping['last_name']]?.trim() || '';
        const phoneNumber = row[columnMapping['phone_number']]?.trim() || '';
        const city = row[columnMapping['city']]?.trim() || '';
        const currentSalary = row[columnMapping['current_salary']]?.trim() || '';
        const expectedSalary = row[columnMapping['expected_salary']]?.trim() || '';
        const resumeUrl = row[columnMapping['resume_url']]?.trim() || '';
        const profilePictureUrl = row[columnMapping['profile_picture_url']]?.trim() || '';
        const originalSource = row[columnMapping['source']]?.trim() || 'CSV Import';

        // Validate email
        if (!email || !validateEmail(email)) {
          rowErrors.push('Invalid email');
          errorLog.push({ row: i + 2, email: email || 'N/A', errors: rowErrors });
          errors++;
          continue;
        }

        // Check if lead already exists
        const { data: existingLead } = await supabase
          .from('carpet_bomb_leads')
          .select('id, email')
          .eq('email', email)
          .single();

        if (existingLead) {
          if (skipDuplicates) {
            skipped++;
            continue;
          }

          // Update existing lead
          const { error: updateError } = await supabase
            .from('carpet_bomb_leads')
            .update({
              first_name: firstName || existingLead.first_name,
              last_name: lastName || existingLead.last_name,
              phone_number: phoneNumber || existingLead.phone_number,
              city: city || existingLead.city,
              current_salary: currentSalary || existingLead.current_salary,
              expected_salary: expectedSalary || existingLead.expected_salary,
              resume_url: resumeUrl || existingLead.resume_url,
              profile_picture_url: profilePictureUrl || existingLead.profile_picture_url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingLead.id);

          if (updateError) throw updateError;
          updated++;
        } else {
          // Insert new lead
          const { error: insertError } = await supabase
            .from('carpet_bomb_leads')
            .insert({
              email,
              first_name: firstName,
              last_name: lastName,
              phone_number: phoneNumber,
              city,
              current_salary: currentSalary,
              expected_salary: expectedSalary,
              resume_url: resumeUrl,
              profile_picture_url: profilePictureUrl,
              original_source: originalSource,
            });

          if (insertError) throw insertError;
          imported++;
        }
      } catch (error: any) {
        rowErrors.push(error.message);
        errorLog.push({
          row: i + 2,
          email: row[columnMapping['email']] || 'N/A',
          errors: rowErrors,
        });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        imported,
        updated,
        skipped,
        errors,
        errorLog: errorLog.slice(0, 100), // Limit to first 100 errors
      },
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}
