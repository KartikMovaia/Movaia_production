// backend/src/modules/analysis/controllers/pdf.controller.ts
import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { analysisService } from '../services/analysis.service';
import axios from 'axios';

export const generateAnalysisPDF = async (req: Request, res: Response): Promise<void> => {
  let browser;
  
  try {
    const { analysisId } = req.params;
    const userId = req.currentUser?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('=== Starting PDF Generation ===');
    console.log('Analysis ID:', analysisId);
    console.log('User ID:', userId);

    // Get analysis data with all files
    const data = await analysisService.getAnalysisFiles(analysisId, userId);
    
    if (!data || !data.analysis) {
      console.error('No analysis data found');
      res.status(404).json({ error: 'Analysis not found' });
      return;
    }

    console.log('Analysis data retrieved successfully');

    // Fetch and parse the metrics CSV
    let metrics = {};
    if (data.files.normal?.resultsCSV) {
      console.log('Fetching metrics CSV...');
      metrics = await fetchCSVMetrics(data.files.normal.resultsCSV);
      console.log('Metrics fetched:', Object.keys(metrics).length, 'metrics');
    }

    // Convert image URLs to base64 to avoid CORS/loading issues
    console.log('Converting images to base64...');
    const imageData = await convertImagesToBase64(data.files.normal?.visualizations);
    console.log('Images converted:', Object.keys(imageData).length, 'images');

    // Build HTML with metrics and base64 images
    const htmlContent = buildPDFHTML(data, metrics, imageData);

    console.log('Launching Puppeteer...');

    // Launch browser with specific settings for image rendering
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security', // Allow base64 images
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport for better rendering
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    
    console.log('Setting page content...');
    
    // Set content with longer timeout
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0', // Wait for all network requests
      timeout: 60000
    });

    // Give extra time for any final rendering
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Generating PDF...');

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { 
        top: '0mm', 
        right: '0mm', 
        bottom: '15mm', 
        left: '0mm' 
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 12px; padding: 0 30px; display: flex; justify-content: space-between; color: #666; margin-top: 5mm;">
          <span>© Movaia - Advanced Running Analysis</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
    });

    await browser.close();

    console.log('=== PDF Generated Successfully ===');
    console.log('Buffer size:', pdfBuffer.length, 'bytes');

    // Set response headers
    const fileName = `Movaia_Analysis_${new Date(data.analysis.createdAt).toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    console.error('=== PDF Generation Error ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// Fetch and parse CSV metrics
async function fetchCSVMetrics(csvUrl: string): Promise<any> {
  try {
    const response = await axios.get(csvUrl);
    const lines = response.data.trim().split('\n');
    
    if (lines.length < 2) return {};
    
    const headers = lines[0].split(',').map((h: string) => h.trim());
    const values = lines[1].split(',').map((v: string) => v.trim());
    
    const metrics: any = {};
    headers.forEach((header: string, index: number) => {
      const value = parseFloat(values[index]);
      metrics[header] = isNaN(value) ? values[index] : value;
    });
    
    return metrics;
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return {};
  }
}

// Convert image URLs to base64 to avoid CORS issues
async function convertImagesToBase64(visualizations: any): Promise<any> {
  const imageData: any = {};
  
  if (!visualizations) return imageData;

  const imagePromises: Promise<void>[] = [];

  // Helper to fetch and convert single image
  const fetchImage = async (url: string | null, key: string) => {
    if (!url) return;
    
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type'] || 'image/png';
      imageData[key] = `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error(`Failed to fetch image ${key}:`, error);
    }
  };

  // Fetch all images
  if (visualizations.fullBody) {
    imagePromises.push(fetchImage(visualizations.fullBody.left, 'fullBodyLeft'));
    imagePromises.push(fetchImage(visualizations.fullBody.right, 'fullBodyRight'));
  }
  
  if (visualizations.footAngle) {
    imagePromises.push(fetchImage(visualizations.footAngle.left, 'footAngleLeft'));
    imagePromises.push(fetchImage(visualizations.footAngle.right, 'footAngleRight'));
  }
  
  if (visualizations.shinAngle) {
    imagePromises.push(fetchImage(visualizations.shinAngle.left, 'shinAngleLeft'));
    imagePromises.push(fetchImage(visualizations.shinAngle.right, 'shinAngleRight'));
  }
  
  if (visualizations.midStanceAngle) {
    imagePromises.push(fetchImage(visualizations.midStanceAngle.left, 'midStanceLeft'));
    imagePromises.push(fetchImage(visualizations.midStanceAngle.right, 'midStanceRight'));
  }
  
  if (visualizations.lean) {
    imagePromises.push(fetchImage(visualizations.lean.left, 'leanLeft'));
    imagePromises.push(fetchImage(visualizations.lean.right, 'leanRight'));
  }
  
  if (visualizations.posture) {
    imagePromises.push(fetchImage(visualizations.posture.left, 'postureLeft'));
    imagePromises.push(fetchImage(visualizations.posture.right, 'postureRight'));
  }
  
  if (visualizations.pelvicDrop) {
    imagePromises.push(fetchImage(visualizations.pelvicDrop.left, 'pelvicDropLeft'));
    imagePromises.push(fetchImage(visualizations.pelvicDrop.right, 'pelvicDropRight'));
  }
  
  if (visualizations.armAngle) {
    imagePromises.push(fetchImage(visualizations.armAngle.left, 'armAngleLeft'));
    imagePromises.push(fetchImage(visualizations.armAngle.right, 'armAngleRight'));
  }

  await Promise.all(imagePromises);
  
  return imageData;
}

// Metric ranges for status determination
const METRIC_RANGES: { [key: string]: { ideal?: [number, number]; workable: [number, number] } } = {
  'step_rate': { ideal: [170, 180], workable: [154, 192] },
  'ground_contact_time-l': { ideal: [0, 250], workable: [250, 300] },
  'ground_contact_time-r': { ideal: [0, 250], workable: [250, 300] },
  'fat-l': { ideal: [-5, 15], workable: [-15, 15] },
  'fat-r': { ideal: [-5, 15], workable: [-15, 15] },
  'sat-l': { ideal: [5, 10], workable: [0, 10] },
  'sat-r': { ideal: [5, 10], workable: [0, 10] },
  'msa-l': { workable: [85, 95] },
  'msa-r': { workable: [85, 95] },
  'lean-l': { ideal: [5, 10], workable: [2, 15] },
  'lean-r': { ideal: [5, 10], workable: [2, 15] },
  'posture-l': { ideal: [-2, 10], workable: [-15, 25] },
  'posture-r': { ideal: [-2, 10], workable: [-15, 25] },
  'col_pelvic_drop-l': { workable: [0, 5] },
  'col_pelvic_drop-r': { workable: [0, 5] },
  'arm_angle-l': { ideal: [45, 80], workable: [40, 90] },
  'arm_angle-r': { ideal: [45, 80], workable: [40, 90] },
};

function getValueStatus(metricKey: string, value: number): 'ideal' | 'workable' | 'check' {
  const range = METRIC_RANGES[metricKey];
  if (!range || value === undefined || value === null) return 'check';
  
  if (range.ideal && value >= range.ideal[0] && value <= range.ideal[1]) {
    return 'ideal';
  } else if (value >= range.workable[0] && value <= range.workable[1]) {
    return 'workable';
  } else {
    return 'check';
  }
}

// Build complete HTML with metrics and base64 images
function buildPDFHTML(data: any, metrics: any, imageData: any): string {
  const { analysis } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          color: #0f172a;
          font-size: 16px;
        }
        
        .header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          padding: 40px 30px;
          margin-bottom: 0;
        }
        .header h1 { 
          font-size: 48px; 
          margin-bottom: 12px;
          font-weight: 700;
        }
        .header .date { 
          font-size: 20px; 
          opacity: 0.9; 
          margin-bottom: 12px; 
        }
        .header .brand { 
          font-size: 16px; 
          color: #ABD037;
          font-weight: 600;
          letter-spacing: 1px;
        }
        
        .metric-page {
          page-break-after: always;
          min-height: 100vh;
          padding: 40px 30px;
          display: flex;
          flex-direction: column;
        }
        
        .section-title {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 20px;
          padding: 15px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-left: 6px solid #ABD037;
          border-radius: 8px;
        }
        
        .metric-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 30px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .metric-header {
          font-size: 32px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
        }
        
        .metric-desc {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        
        .metric-images {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          justify-content: center;
        }
        
        .metric-images img {
          width: 400px;
          height: 300px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .metric-values {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .value-box {
          flex: 1;
          padding: 30px;
          border-radius: 12px;
          border: 3px solid;
          text-align: center;
        }
        
        .value-box.ideal { 
          background: #dcfce7; 
          border-color: #ABD037;
        }
        .value-box.workable { 
          background: #fef3c7; 
          border-color: #fbbf24;
        }
        .value-box.check { 
          background: #fee2e2; 
          border-color: #ef4444;
        }
        
        .value-box .label {
          font-size: 16px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        
        .value-box .value {
          font-size: 56px;
          font-weight: 700;
          color: #0f172a;
        }
        
        .value-box .unit {
          font-size: 24px;
          color: #64748b;
          margin-left: 5px;
        }
        
        .metric-target {
          font-size: 18px;
          color: #64748b;
          text-align: center;
          margin-top: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
        }
        
        .metric-target strong {
          color: #0f172a;
          font-size: 20px;
        }
        
        .single-value {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 3px solid #ABD037;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .single-value .value {
          font-size: 72px;
          font-weight: 700;
          color: #0f172a;
        }
        
        .single-value .unit {
          font-size: 32px;
          color: #64748b;
          margin-left: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header" style="page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: center;">
        <h1>Gait Analysis Report</h1>
        <div class="date">${new Date(analysis.createdAt).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}</div>
        <div class="brand">MOVAIA ADVANCED RUNNING ANALYSIS</div>
      </div>

      ${generateMetricSections(metrics, imageData)}

    </body>
    </html>
  `;
}

function generateMetricSections(metrics: any, imageData: any): string {
  let html = '';
  
  // Temporal Metrics Section - One metric per page
  html += generateSingleMetricPage(
    'Temporal Metrics',
    'Cadence (Step Rate)', 
    metrics['step_rate'], 
    'spm', 
    '170-180', 
    'Steps per minute - higher cadence reduces impact forces and improves running efficiency',
    imageData.fullBodyLeft
  );
  
  html += generateDualMetricPage(
    'Temporal Metrics',
    'Ground Contact Time',
    metrics['ground_contact_time-l'],
    metrics['ground_contact_time-r'],
    'ground_contact_time-l',
    'ground_contact_time-r',
    'ms',
    '<250',
    'Time your foot spends on the ground during each stride. Shorter contact time indicates better efficiency.',
    imageData.fullBodyLeft,
    imageData.fullBodyRight
  );
  
  // Foot Strike Analysis
  html += generateDualMetricPage(
    'Foot Strike Analysis',
    'Foot Angle at Contact',
    metrics['fat-l'],
    metrics['fat-r'],
    'fat-l',
    'fat-r',
    '°',
    '-5 to 15',
    'Angle of your foot when it hits the ground. Proper angle reduces braking forces and injury risk.',
    imageData.footAngleLeft,
    imageData.footAngleRight
  );
  
  html += generateDualMetricPage(
    'Foot Strike Analysis',
    'Shank Angle at Contact',
    metrics['sat-l'],
    metrics['sat-r'],
    'sat-l',
    'sat-r',
    '°',
    '5-10',
    'Shank (lower leg) angle when your foot strikes the ground. Optimal angle promotes efficient force transfer.',
    imageData.shinAngleLeft,
    imageData.shinAngleRight
  );
  
  html += generateDualMetricPage(
    'Foot Strike Analysis',
    'Max Shank Angle',
    metrics['msa-l'],
    metrics['msa-r'],
    'msa-l',
    'msa-r',
    '°',
    '85-95',
    'Maximum shank angle during stance phase. Indicates proper knee flexion and shock absorption.',
    imageData.midStanceLeft,
    imageData.midStanceRight
  );
  
  // Body Position & Alignment
  html += generateDualMetricPage(
    'Body Position & Alignment',
    'Forward Lean',
    metrics['lean-l'],
    metrics['lean-r'],
    'lean-l',
    'lean-r',
    '°',
    '5-10',
    'Forward trunk lean from vertical. Proper lean improves propulsion and reduces braking forces.',
    imageData.leanLeft,
    imageData.leanRight
  );
  
  html += generateDualMetricPage(
    'Body Position & Alignment',
    'Posture Angle',
    metrics['posture-l'],
    metrics['posture-r'],
    'posture-l',
    'posture-r',
    '°',
    '-2 to 10',
    'Overall body alignment and posture during running. Good posture promotes efficiency and reduces injury risk.',
    imageData.postureLeft,
    imageData.postureRight
  );
  
  // Pelvic & Hip Stability
  html += generateDualMetricPage(
    'Pelvic & Hip Stability',
    'Pelvic Drop',
    metrics['col_pelvic_drop-l'],
    metrics['col_pelvic_drop-r'],
    'col_pelvic_drop-l',
    'col_pelvic_drop-r',
    '°',
    '<5',
    'Hip drop during single-leg stance. Excessive drop indicates weak hip stabilizers and increases injury risk.',
    imageData.pelvicDropLeft,
    imageData.pelvicDropRight
  );
  
  // Arm Swing
  html += generateDualMetricPage(
    'Arm Swing & Upper Body',
    'Arm Swing Angle',
    metrics['arm_angle-l'],
    metrics['arm_angle-r'],
    'arm_angle-l',
    'arm_angle-r',
    '°',
    '45-80',
    'Range of arm swing motion. Proper arm swing balances lower body movement and improves efficiency.',
    imageData.armAngleLeft,
    imageData.armAngleRight
  );
  
  return html;
}

function generateSingleMetricPage(
  sectionTitle: string,
  title: string,
  value: number,
  unit: string,
  ideal: string,
  description: string,
  imageUrl?: string
): string {
  if (!value) return '';
  
  return `
    <div class="metric-page">
      <h2 class="section-title">${sectionTitle}</h2>
      <div class="metric-card">
        <div class="metric-header">${title}</div>
        <div class="metric-desc">${description}</div>
        ${imageUrl ? `
          <div class="metric-images">
            <img src="${imageUrl}" alt="${title}" />
          </div>
        ` : ''}
        <div class="single-value">
          <span class="value">${Math.round(value)}</span>
          <span class="unit">${unit}</span>
        </div>
        <div class="metric-target">Target Range: <strong>${ideal}</strong></div>
      </div>
    </div>
  `;
}

function generateDualMetricPage(
  sectionTitle: string,
  title: string,
  leftValue: number,
  rightValue: number,
  leftKey: string,
  rightKey: string,
  unit: string,
  ideal: string,
  description: string,
  leftImage?: string,
  rightImage?: string
): string {
  if (!leftValue && !rightValue) return '';
  
  const leftStatus = getValueStatus(leftKey, leftValue);
  const rightStatus = getValueStatus(rightKey, rightValue);
  
  return `
    <div class="metric-page">
      <h2 class="section-title">${sectionTitle}</h2>
      <div class="metric-card">
        <div class="metric-header">${title}</div>
        <div class="metric-desc">${description}</div>
        ${leftImage || rightImage ? `
          <div class="metric-images">
            ${leftImage ? `<img src="${leftImage}" alt="${title} - Left" />` : ''}
            ${rightImage ? `<img src="${rightImage}" alt="${title} - Right" />` : ''}
          </div>
        ` : ''}
        <div class="metric-values">
          <div class="value-box ${leftStatus}">
            <div class="label">Left</div>
            <div class="value">${leftValue ? leftValue.toFixed(1) : 'N/A'}<span class="unit">${unit}</span></div>
          </div>
          <div class="value-box ${rightStatus}">
            <div class="label">Right</div>
            <div class="value">${rightValue ? rightValue.toFixed(1) : 'N/A'}<span class="unit">${unit}</span></div>
          </div>
        </div>
        <div class="metric-target">Target Range: <strong>${ideal}</strong></div>
      </div>
    </div>
  `;
}