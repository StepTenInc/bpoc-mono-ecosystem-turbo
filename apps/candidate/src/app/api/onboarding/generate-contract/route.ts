import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for PDF generation

/**
 * POST /api/onboarding/generate-contract
 * Generate Philippines labor law-compliant employment contract
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { onboardingId } = await request.json();

    // Fetch onboarding data
    const { data: onboarding, error } = await supabase
      .from('candidate_onboarding')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (error || !onboarding) {
      return NextResponse.json({ error: 'Onboarding not found' }, { status: 404 });
    }

    // Generate contract HTML
    const contractHtml = generatePhilippinesContract(onboarding);

    // Generate PDF from HTML using Puppeteer
    let browser;
    let pdfBuffer: Buffer | null = null;

    try {
      // Launch browser with appropriate settings for Vercel
      const isProduction = process.env.NODE_ENV === 'production';

      browser = await puppeteer.launch({
        args: isProduction ? chromium.args : [],
        defaultViewport: chromium.defaultViewport,
        executablePath: isProduction
          ? await chromium.executablePath()
          : process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : process.platform === 'darwin'
              ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
              : '/usr/bin/google-chrome',
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setContent(contractHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      await browser.close();
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      if (browser) await browser.close();
      // Continue without PDF if generation fails
    }

    // Upload PDF to Supabase Storage if generated
    let contractPdfUrl = null;

    if (pdfBuffer) {
      const timestamp = Date.now();
      const fileName = `contract-${timestamp}.pdf`;
      const filePath = `contracts/${onboarding.candidate_id}/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('candidates')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading PDF to storage:', uploadError);
      } else {
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('candidates')
          .getPublicUrl(filePath);

        contractPdfUrl = urlData.publicUrl;
      }
    }

    // Save contract to employment_contracts table
    const { data: contract, error: contractError } = await supabase
      .from('employment_contracts')
      .insert({
        candidate_onboarding_id: onboardingId,
        contract_html: contractHtml,
        contract_pdf_url: contractPdfUrl,
        employee_name: `${onboarding.first_name} ${onboarding.middle_name || ''} ${onboarding.last_name}`.trim(),
        employee_address: onboarding.address,
        position: onboarding.position,
        contact_type: onboarding.contact_type,
        assigned_client: onboarding.assigned_client,
        start_date: onboarding.start_date,
        work_schedule: onboarding.work_schedule,
        basic_salary: onboarding.basic_salary,
        de_minimis: onboarding.de_minimis,
        total_monthly_gross: onboarding.total_monthly_gross,
        hmo_offer: onboarding.hmo_offer,
        paid_leave: onboarding.paid_leave,
        probationary_period: onboarding.probationary_period
      })
      .select()
      .single();

    if (contractError) {
      return NextResponse.json({ error: contractError.message }, { status: 500 });
    }

    // Update onboarding record with contract PDF URL
    if (contractPdfUrl) {
      await supabase
        .from('candidate_onboarding')
        .update({ contract_pdf_url: contractPdfUrl })
        .eq('id', onboardingId);
    }

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      contractHtml,
      contractPdfUrl,
      message: 'Contract generated successfully'
    });

  } catch (error: any) {
    console.error('Generate contract error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generatePhilippinesContract(data: any): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Employment Contract</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    h1 { text-align: center; font-size: 18px; margin-bottom: 30px; }
    h2 { font-size: 14px; margin-top: 30px; }
    p { margin: 10px 0; text-align: justify; }
    .signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-line { border-top: 1px solid black; width: 250px; text-align: center; padding-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    table th, table td { border: 1px solid black; padding: 8px; text-align: left; }
  </style>
</head>
<body>
  <h1>EMPLOYMENT CONTRACT</h1>
  
  <p>This Employment Contract ("Contract") is entered into on <strong>${today}</strong> by and between:</p>
  
  <p><strong>EMPLOYER:</strong> ShoreAgents<br/>
  Address: Business Center 26, Philexcel Business Park, Clark Freeport Zone, Pampanga, 2023, Philippines</p>
  
  <p><strong>EMPLOYEE:</strong> ${data.first_name} ${data.middle_name || ''} ${data.last_name}<br/>
  Address: ${data.address || 'N/A'}</p>
  
  <h2>SECTION 1: NATURE OF EMPLOYMENT</h2>
  <p><strong>Position:</strong> ${data.position}</p>
  <p><strong>Employment Type:</strong> ${data.contact_type === 'FULL_TIME' ? 'Full-Time' : data.contact_type === 'PART_TIME' ? 'Part-Time' : 'Project-Based'}</p>
  <p><strong>Client Assignment:</strong> ${data.assigned_client || 'To be determined'}</p>
  <p><strong>Start Date:</strong> ${data.start_date ? new Date(data.start_date).toLocaleDateString() : 'TBD'}</p>
  <p><strong>Work Schedule:</strong> ${data.work_schedule || 'Standard business hours'}</p>
  <p><strong>Probationary Period:</strong> ${data.probationary_period || '6 months'}</p>
  
  <h2>SECTION 2: DUTIES AND RESPONSIBILITIES</h2>
  <p>The Employee agrees to perform duties as assigned by the Employer, including but not limited to:</p>
  <ul>
    <li>Performing tasks related to the assigned position</li>
    <li>Adhering to company policies and procedures</li>
    <li>Maintaining confidentiality of client and company information</li>
    <li>Meeting performance standards and productivity metrics</li>
  </ul>
  
  <h2>SECTION 3: COMPENSATION AND BENEFITS</h2>
  <table>
    <tr><th>Component</th><th>Amount (PHP)</th></tr>
    <tr><td>Basic Salary</td><td>${data.basic_salary ? parseFloat(data.basic_salary).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}</td></tr>
    <tr><td>De Minimis Benefits</td><td>${data.de_minimis ? parseFloat(data.de_minimis).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}</td></tr>
    <tr><td><strong>Total Monthly Gross</strong></td><td><strong>${data.total_monthly_gross ? parseFloat(data.total_monthly_gross).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '0.00'}</strong></td></tr>
  </table>
  
  <p><strong>Government-Mandated Benefits:</strong></p>
  <ul>
    <li>SSS (Social Security System) contributions</li>
    <li>PhilHealth (Philippine Health Insurance) contributions</li>
    <li>Pag-IBIG (Home Development Mutual Fund) contributions</li>
    <li>13th Month Pay (per Presidential Decree No. 851)</li>
  </ul>
  
  <p><strong>Company Benefits:</strong></p>
  <ul>
    <li>HMO: ${data.hmo_offer || 'Not included'}</li>
    <li>Paid Leave: ${data.paid_leave || 'Per company policy'}</li>
  </ul>
  
  <h2>SECTION 4: CONFIDENTIALITY AND DATA PROTECTION</h2>
  <p>The Employee shall:</p>
  <ul>
    <li>Maintain strict confidentiality of all proprietary information, trade secrets, and client data</li>
    <li>Comply with the Data Privacy Act of 2012 (Republic Act No. 10173)</li>
    <li>Not disclose any confidential information during or after employment</li>
    <li>Return all company property and documents upon termination</li>
  </ul>
  
  <h2>SECTION 5: TERMINATION</h2>
  <p><strong>Notice Period:</strong> Either party may terminate this contract with 30 days written notice.</p>
  
  <p><strong>Just Causes for Termination (per Labor Code of the Philippines):</strong></p>
  <ul>
    <li>Serious misconduct or willful disobedience</li>
    <li>Gross and habitual neglect of duties</li>
    <li>Fraud or willful breach of trust</li>
    <li>Commission of a crime against the employer or family</li>
  </ul>
  
  <p><strong>Authorized Causes:</strong> Redundancy, retrenchment, disease, or closure of business with proper notice and separation pay as required by law.</p>
  
  <h2>SECTION 6: GENERAL PROVISIONS</h2>
  <p><strong>Governing Law:</strong> This contract is governed by the Labor Code of the Philippines and all applicable Philippine labor laws.</p>
  
  <p><strong>Amendments:</strong> Any modifications to this contract must be made in writing and signed by both parties.</p>
  
  <p><strong>Entire Agreement:</strong> This contract constitutes the entire agreement between the parties and supersedes all prior agreements or understandings.</p>
  
  <h2>ACKNOWLEDGMENT</h2>
  <p>By signing below, both parties acknowledge that they have read, understood, and agree to all terms and conditions of this Employment Contract.</p>
  
  <div class="signature">
    <div>
      <div class="signature-line">Employee Signature</div>
      <p style="text-align: center;">${data.first_name} ${data.last_name}<br/>Date: _______________</p>
    </div>
    <div>
      <div class="signature-line">Employer Representative</div>
      <p style="text-align: center;">ShoreAgents<br/>Date: _______________</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
