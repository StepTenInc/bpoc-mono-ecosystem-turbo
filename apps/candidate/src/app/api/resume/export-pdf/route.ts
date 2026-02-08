import { NextRequest, NextResponse } from 'next/server';

// Puppeteer cannot run in the Edge runtime
export const runtime = 'nodejs';
// Give headless Chrome enough time on serverless
export const maxDuration = 60;

type ExportPdfBody = {
  html?: string;
  fileName?: string;
};

function sanitizeFileName(name: string) {
  const base = (name || 'resume.pdf').trim() || 'resume.pdf';
  const withExt = base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
  return withExt.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  let browser: any | null = null;

  try {
    const body = (await request.json()) as ExportPdfBody;
    const html = body?.html;
    const fileName = sanitizeFileName(body?.fileName || 'resume.pdf');

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (isServerless) {
      const [{ default: puppeteerCore }, chromium] = await Promise.all([
        import('puppeteer-core'),
        import('@sparticuz/chromium'),
      ]);

      // Recommended for serverless to reduce dependencies/graphics
      if (typeof (chromium as any).setGraphicsMode === 'function') {
        (chromium as any).setGraphicsMode(false);
      }

      const executablePath = await (chromium as any).executablePath();

      browser = await puppeteerCore.launch({
        args: [...((chromium as any).args || []), '--no-sandbox', '--disable-setuid-sandbox'],
        executablePath,
        headless: (chromium as any).headless !== false,
      });
    } else {
      const { default: puppeteer } = await import('puppeteer');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.CHROME_PATH || undefined,
      });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Inject print-specific CSS to prevent extra pages
    const printCSS = `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: auto !important;
            min-height: 0 !important;
          }
          * {
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      </style>
    `;
    
    const htmlWithPrintCSS = html.replace('</head>', `${printCSS}</head>`);
    
    await page.setContent(htmlWithPrintCSS, {
      waitUntil: 'networkidle0',
      timeout: 60_000,
    });

    // Ensure web fonts are ready (helps spacing/line breaks)
    try {
      await page.evaluate(() => (document as any).fonts?.ready);
    } catch {
      // non-fatal
    }

    // Debug: log content info
    const contentInfo = await page.evaluate(() => {
      const body = document.body;
      return {
        bodyChildren: body.children.length,
        bodyText: body.textContent?.substring(0, 200),
        bodyHTML: body.innerHTML.substring(0, 500),
        firstChildDisplay: body.firstElementChild ? window.getComputedStyle(body.firstElementChild).display : 'none',
        firstChildVisibility: body.firstElementChild ? window.getComputedStyle(body.firstElementChild).visibility : 'hidden',
      };
    });
    console.log('📄 PDF content check:', contentInfo);

    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      timeout: 60_000,
    });

    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);

    try {
      await page.close();
    } catch {}
    try {
      await browser.close();
    } catch {}

    return new NextResponse(new Uint8Array(pdfBuffer) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [POST /api/resume/export-pdf] Error:', error);

    if (browser) {
      try {
        await browser.close();
      } catch {}
    }

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: message,
        hint:
          'If running locally, ensure Chrome is installed or run `npx puppeteer browsers install chrome` and restart the server.',
      },
      { status: 500 }
    );
  }
}


