import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import crypto from 'crypto';

// For local development
const isDev = process.env.NODE_ENV === 'development';

// Generate SHA-256 hash of buffer
export function generatePdfHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// PDF metadata helper
export function generatePdfMetadata(contract: any, signature?: any) {
  return {
    title: `Employment Contract - ${contract.employee?.name || 'Unknown'}`,
    subject: `Employment Contract for ${contract.position?.title || 'Position'}`,
    author: contract.employer?.name || 'BPOC Platform',
    creator: 'BPOC.io',
    producer: 'Puppeteer/Chromium',
    keywords: [
      'Employment Contract',
      'DOLE Compliant',
      'Philippine Labor Code',
      signature?.certificate_id || contract.contractId
    ].join(', '),
    creationDate: new Date(),
    modDate: new Date()
  };
}

// Generate HTML for PDF (print-optimized version of contract)
export function generateContractHTML(contract: any): string {
  const {
    contractId,
    generatedAt,
    employer,
    employee,
    position,
    compensation,
    period,
    workingHours,
    doleTerms,
    termination,
    signatures,
    legalCompliance
  } = contract;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Employment Contract - ${employee.name}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm 2.5cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .header .subtitle {
      font-size: 10pt;
      color: #333;
      margin-top: 5px;
    }
    
    .contract-id {
      font-size: 9pt;
      color: #666;
      margin-top: 10px;
      font-family: 'Courier New', monospace;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    
    .subsection {
      margin-bottom: 15px;
    }
    
    .subsection-title {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 8px;
    }
    
    .field-label {
      font-weight: bold;
      display: inline-block;
      min-width: 150px;
    }
    
    .field-value {
      display: inline;
    }
    
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin: 20px 0;
    }
    
    .party-box {
      border: 1px solid #ccc;
      padding: 15px;
      background: #f9f9f9;
    }
    
    .party-box h3 {
      font-size: 12pt;
      margin-bottom: 10px;
      border-bottom: 1px solid #999;
      padding-bottom: 5px;
    }
    
    .party-info {
      font-size: 10pt;
      line-height: 1.8;
    }
    
    .dole-badge {
      background: #e8f5e9;
      border: 2px solid #4caf50;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
      border-radius: 5px;
    }
    
    .dole-badge h3 {
      color: #2e7d32;
      font-size: 12pt;
      margin-bottom: 5px;
    }
    
    .dole-badge p {
      font-size: 9pt;
      color: #555;
    }
    
    .terms-list {
      list-style: none;
      padding-left: 0;
    }
    
    .terms-list li {
      margin-bottom: 12px;
      padding-left: 25px;
      position: relative;
    }
    
    .terms-list li:before {
      content: "•";
      position: absolute;
      left: 10px;
      font-weight: bold;
    }
    
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 30px;
    }
    
    .signature-box {
      border: 2px solid #333;
      padding: 20px;
      min-height: 150px;
      background: ${signatures.candidate.signed ? '#e8f5e9' : '#fff3e0'};
    }
    
    .signature-box.signed {
      background: #e8f5e9;
      border-color: #4caf50;
    }
    
    .signature-box h4 {
      font-size: 11pt;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    
    .signature-details {
      font-size: 9pt;
      line-height: 1.8;
    }
    
    .signature-line {
      border-top: 2px solid #000;
      margin-top: 40px;
      padding-top: 10px;
    }
    
    .certificate-id {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
      color: #666;
      margin-top: 10px;
      word-break: break-all;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 8pt;
      color: #666;
      text-align: center;
    }
    
    .laws-section {
      margin-top: 30px;
      padding: 15px;
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    
    .laws-section h3 {
      font-size: 11pt;
      margin-bottom: 10px;
    }
    
    .law-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    
    .law-tag {
      display: inline-block;
      padding: 5px 10px;
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 3px;
      font-size: 8pt;
    }
    
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .party-box, .signature-box { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>Employment Contract</h1>
    <div class="subtitle">Republic of the Philippines</div>
    <div class="subtitle">Compliant with DOLE Labor Code and RA 8792 (E-Commerce Act)</div>
    <div class="contract-id">Contract ID: ${contractId}</div>
    <div class="contract-id">Generated: ${new Date(generatedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</div>
  </div>

  <!-- DOLE Compliance Badge -->
  <div class="dole-badge">
    <h3>✓ DOLE Compliant Contract</h3>
    <p>${legalCompliance.doleCompliance || 'Philippine Labor Code (PD 442), as amended - Republic of the Philippines'}</p>
  </div>

  <!-- Parties -->
  <div class="section">
    <div class="section-title">Contracting Parties</div>
    <div class="parties-grid">
      <div class="party-box">
        <h3>EMPLOYER</h3>
        <div class="party-info">
          <p><strong>${employer.name}</strong></p>
          ${employer.address ? `<p>${employer.address}</p>` : ''}
          ${employer.phone ? `<p>Phone: ${employer.phone}</p>` : ''}
          ${employer.email ? `<p>Email: ${employer.email}</p>` : ''}
        </div>
      </div>
      <div class="party-box">
        <h3>EMPLOYEE</h3>
        <div class="party-info">
          <p><strong>${employee.name}</strong></p>
          <p>Email: ${employee.email}</p>
          ${employee.phone ? `<p>Phone: ${employee.phone}</p>` : ''}
          ${employee.address ? `<p>Address: ${employee.address}</p>` : ''}
          <p>Nationality: ${employee.nationality}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Position Details -->
  <div class="section">
    <div class="section-title">Position Details</div>
    <div class="subsection">
      <p><span class="field-label">Job Title:</span> <span class="field-value">${position.title}</span></p>
      <p><span class="field-label">Employment Type:</span> <span class="field-value">${position.type}</span></p>
      <p><span class="field-label">Work Arrangement:</span> <span class="field-value">${position.location}</span></p>
    </div>
    <div class="subsection">
      <p class="subsection-title">Job Description:</p>
      <p>${position.description}</p>
    </div>
  </div>

  <!-- Compensation -->
  <div class="section">
    <div class="section-title">Compensation & Benefits</div>
    <p><span class="field-label">Salary:</span> <span class="field-value">${compensation.currency} ${compensation.salary.toLocaleString()} (${compensation.salaryType})</span></p>
    <p><span class="field-label">Payment Schedule:</span> <span class="field-value">${compensation.paymentSchedule}</span></p>
    ${compensation.benefits && compensation.benefits.length > 0 ? `
    <div class="subsection">
      <p class="subsection-title">Benefits:</p>
      <ul class="terms-list">
        ${compensation.benefits.map((benefit: string) => `<li>${benefit}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>

  <!-- Employment Period -->
  <div class="section">
    <div class="section-title">Employment Period</div>
    <p><span class="field-label">Start Date:</span> <span class="field-value">${new Date(period.startDate).toLocaleDateString('en-PH')}</span></p>
    <p><span class="field-label">Employment Type:</span> <span class="field-value">${period.type}</span></p>
    <p><span class="field-label">Probationary Period:</span> <span class="field-value">${period.probationaryPeriod}</span></p>
  </div>

  <!-- Working Hours -->
  <div class="section">
    <div class="section-title">Working Hours & Schedule</div>
    <p><span class="field-label">Regular Hours:</span> <span class="field-value">${workingHours.regularHours}</span></p>
    <p><span class="field-label">Weekly Hours:</span> <span class="field-value">${workingHours.weeklyHours}</span></p>
    <p><span class="field-label">Rest Days:</span> <span class="field-value">${workingHours.restDays}</span></p>
    <p><span class="field-label">Overtime:</span> <span class="field-value">${workingHours.overtime}</span></p>
  </div>

  <!-- DOLE Terms -->
  <div class="section">
    <div class="section-title">Philippine Labor Code Protections</div>
    <ul class="terms-list">
      ${Object.entries(doleTerms).map(([key, value]) => `
        <li><strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${value}</li>
      `).join('')}
    </ul>
  </div>

  <!-- Termination -->
  <div class="section">
    <div class="section-title">Termination Provisions</div>
    <ul class="terms-list">
      ${Object.entries(termination).map(([key, value]) => `
        <li><strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${value}</li>
      `).join('')}
    </ul>
  </div>

  <!-- Signatures -->
  <div class="signature-section">
    <div class="section-title">Signatures</div>
    <div class="signature-grid">
      <!-- Employee Signature -->
      <div class="signature-box ${signatures.candidate.signed ? 'signed' : ''}">
        <h4>Employee Signature</h4>
        ${signatures.candidate.signed ? `
          <div class="signature-details">
            <p><strong>✓ ELECTRONICALLY SIGNED</strong></p>
            <p><strong>Signed by:</strong> ${signatures.candidate.signatoryName}</p>
            <p><strong>Date:</strong> ${new Date(signatures.candidate.signedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
            <p><strong>Method:</strong> ${signatures.candidate.signatureMethod || 'Electronic Signature'}</p>
            ${signatures.candidate.certificateId ? `
              <div class="certificate-id">
                <p><strong>Certificate ID:</strong></p>
                <p>${signatures.candidate.certificateId}</p>
              </div>
            ` : ''}
          </div>
        ` : `
          <div class="signature-details">
            <p><strong>Status:</strong> Pending Signature</p>
            <div class="signature-line">
              <p>_________________________________</p>
              <p>Employee Signature</p>
            </div>
          </div>
        `}
      </div>

      <!-- Employer Signature -->
      <div class="signature-box">
        <h4>Employer Signature</h4>
        <div class="signature-details">
          <p><strong>For and on behalf of:</strong></p>
          <p>${employer.name}</p>
          <div class="signature-line">
            <p>_________________________________</p>
            <p>Authorized Representative</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Legal Compliance -->
  <div class="laws-section">
    <h3>Applicable Laws & Regulations</h3>
    <div class="law-tags">
      ${legalCompliance.applicableLaws.map((law: string) => `
        <span class="law-tag">${law}</span>
      `).join('')}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>This is a legally binding employment contract generated by BPOC.io</p>
    <p>Compliant with Philippine Labor Code (PD 442) and E-Commerce Act (RA 8792)</p>
    ${signatures.candidate.signed ? `<p>Document Hash: ${signatures.candidate.documentHash || 'N/A'}</p>` : ''}
  </div>
</body>
</html>
  `.trim();
}

// Main PDF generation function
export async function generateContractPDF(contract: any): Promise<Buffer> {
  let browser = null;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      args: isDev 
        ? puppeteer.defaultArgs()
        : [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: chromium.defaultViewport,
      executablePath: isDev
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // macOS default
        : await chromium.executablePath(),
      headless: true
    });

    const page = await browser.newPage();

    // Generate HTML
    const html = generateContractHTML(contract);

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2.5cm',
        bottom: '2cm',
        left: '2.5cm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 8px; text-align: center; width: 100%; color: #666; padding: 10px;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `
    });

    return Buffer.from(pdfBuffer);

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

