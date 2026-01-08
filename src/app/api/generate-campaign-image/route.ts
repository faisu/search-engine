import { NextRequest, NextResponse } from 'next/server';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';

// Mark as dynamic (this route generates images dynamically)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ward,
      language,
      voterDetails,
    } = body;

    // Validate inputs
    if (!ward || !language || !voterDetails) {
      return NextResponse.json(
        { error: 'Missing required parameters: ward, language, voterDetails' },
        { status: 400 }
      );
    }

    const srNo =
      voterDetails?.sr_no ??
      voterDetails?.srNo ??
      voterDetails?.sr_no?.toString?.() ??
      voterDetails?.serial_no ??
      voterDetails?.serialNo ??
      null;

    // Generate structured rows (label + value) based on language
    let rows: { label: string; value: string }[] = [];
    
    const pollingStation = voterDetails.pollingStation && voterDetails.pollingStation.length > 40 
      ? voterDetails.pollingStation.substring(0, 40) 
      : (voterDetails.pollingStation || 'N/A');
    const pollingStationAddress = voterDetails.pollingAddress || 'N/A';
    
    if (language === '1') { // Marathi
      rows = [
        { label: 'नाव:', value: voterDetails.name || 'N/A' },
        { label: 'EPIC क्रमांक:', value: voterDetails.epic || 'N/A' },
        { label: 'वय:', value: `${voterDetails.age || 'N/A'} | लिंग: ${voterDetails.gender || 'N/A'}` },
        { label: 'SR क्र.:', value: `${srNo || 'N/A'} | भाग क्र.: ${voterDetails.partBooth || 'N/A'}` },
        { label: 'मतदान केंद्र:', value: pollingStation },
        { label: 'मतदान केंद्र पत्ता:', value: pollingStationAddress },
      ];
    } else if (language === '2') { // Hindi
      rows = [
        { label: 'नाम:', value: voterDetails.name || 'N/A' },
        { label: 'EPIC नंबर:', value: voterDetails.epic || 'N/A' },
        { label: 'आयु:', value: `${voterDetails.age || 'N/A'} | लिंग: ${voterDetails.gender || 'N/A'}` },
        { label: 'SR नं.:', value: `${srNo || 'N/A'} | भाग नं.: ${voterDetails.partBooth || 'N/A'}` },
        { label: 'मतदान केंद्र:', value: pollingStation },
        { label: 'मतदान केंद्र पत्ता:', value: pollingStationAddress },
      ];
    } else { // English
      rows = [
        { label: 'Name:', value: voterDetails.name || 'N/A' },
        { label: 'EPIC No.:', value: voterDetails.epic || 'N/A' },
        { label: 'Age:', value: `${voterDetails.age || 'N/A'} | Gender: ${voterDetails.gender || 'N/A'}` },
        { label: 'SR No.:', value: `${srNo || 'N/A'} | Part No.: ${voterDetails.partBooth || 'N/A'}` },
        { label: 'Polling Station:', value: pollingStation },
        { label: 'Polling Station Address:', value: voterDetails.pollingAddress || 'N/A' },
      ];
    }

    // Validate ward number
    const validWards = ['140', '141', '143', '144', '145', '146', '147', '148'];
    if (!validWards.includes(ward)) {
      return NextResponse.json(
        { error: `Invalid ward number: ${ward}. Valid wards are: ${validWards.join(', ')}` },
        { status: 400 }
      );
    }

    // Register fonts (CRITICAL: Must be inside POST function for Vercel)
    const fontDir = path.join(process.cwd(), 'fonts');

    // English
    registerFont(path.join(fontDir, 'Roboto-Regular.ttf'), {
      family: 'Roboto',
      weight: 'normal',
    });

    registerFont(path.join(fontDir, 'Roboto-Bold.ttf'), {
      family: 'Roboto',
      weight: 'bold',
    });

    // Marathi / Hindi
    registerFont(path.join(fontDir, 'NotoSansDevanagari-Regular.ttf'), {
      family: 'NotoDev',
      weight: 'normal',
    });

    registerFont(path.join(fontDir, 'NotoSansDevanagari-Bold.ttf'), {
      family: 'NotoDev',
      weight: 'bold',
    });

    // Helper function to get font family based on language
    const getFontFamily = (language: string) =>
      language === '1' || language === '2'
        ? 'NotoDev'
        : 'Roboto';

    // Load ward-specific template image from public/final_slip folder
    const templatePath = path.join(process.cwd(), 'public', 'final_slip', `${ward}.jpeg`);
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: `Template image not found for ward ${ward}` },
        { status: 404 }
      );
    }

    // Load the template image
    const templateImage = await loadImage(templatePath);
    
    // Create canvas with template dimensions
    const canvas = createCanvas(templateImage.width, templateImage.height);
    const ctx = canvas.getContext('2d');

    // OPTIONAL DEBUG: Uncomment to verify fonts are working
    // ctx.font = "30px Roboto";
    // ctx.fillText("English OK", 50, 50);
    // ctx.font = "30px NotoDev";
    // ctx.fillText("मराठी ठीक आहे", 50, 100);
    // If both show correctly → fonts are working ✅

    // Draw template image
    ctx.drawImage(templateImage, 0, 0);

    const fontSize = 24;
    const fontColor = '#000000';
    const lineHeight = fontSize * 1.5;
    const maxWidth = 850;
    
    // Get font family based on language
    const fontFamily = getFontFamily(language);
    
    ctx.fillStyle = fontColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const labelX = 50;
    const valueX = 50;
    const spacingBetweenLabelAndValue = 0;
    const linePaddingOffsets = [0, 0, 0];
    const addressRightPadding = 250; // Right padding for Polling Station Address field
    const y = [141, 144, 145, 147].includes(parseInt(ward)) ? 380 : 340;

    let currentY = y;
    rows.forEach(({ label, value }) => {
      const isPollingStationAddress = 
        label === 'मतदान केंद्र पत्ता:' || 
        label === 'Polling Station Address:';
      
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const labelText = `${label} `;
      const labelWidth = ctx.measureText(labelText).width;
      ctx.fillText(labelText, labelX, currentY);

      const valueStartX = isPollingStationAddress
        ? Math.round(labelX + labelWidth + spacingBetweenLabelAndValue)
        : (valueX === labelX 
          ? Math.round(labelX + labelWidth + spacingBetweenLabelAndValue)
          : Math.round(valueX));
      // Calculate rightEdge: for address field, apply right padding
      // Use same rightEdge for all lines to maintain consistent right padding
      const rightEdge = isPollingStationAddress
        ? Math.round(valueStartX + maxWidth - addressRightPadding)
        : Math.round(valueStartX + maxWidth);
      const availableWidth = rightEdge - valueStartX;
      
      const hasSeparators = value.includes('|');
      let firstLineOffset = 0;
      if (isPollingStationAddress) {
        firstLineOffset = 0;
      } else if (linePaddingOffsets[0] !== undefined) {
        firstLineOffset = linePaddingOffsets[0];
      }
      let currentX = Math.round(valueStartX + firstLineOffset);
      let lineIndex = 0;
      let currentYForLine = currentY;
      
      if (!hasSeparators) {
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const words = value.split(' ').filter(w => w.length > 0);
        const lines: string[] = [];
        let currentLine = '';
        let isFirstLine = true;
        
        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          
          // For Polling Station Address: first line uses valueStartX width, subsequent lines use labelX width
          // All lines use the same rightEdge to maintain consistent right padding
          const lineAvailableWidth = isPollingStationAddress && !isFirstLine
            ? rightEdge - labelX  // Use same rightEdge as line 1, but start from labelX
            : availableWidth;  // First line: already includes padding via rightEdge
          
          if (metrics.width > lineAvailableWidth && currentLine.trim().length > 0) {
            lines.push(currentLine.trim());
            currentLine = word;
            isFirstLine = false;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        
        ctx.save();
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = fontColor;
        
        lines.forEach((line, idx) => {
          const yPos = currentY + idx * lineHeight;
          const trimmedLine = line.trim();
          let lineOffset = 0;
          if (isPollingStationAddress) {
            lineOffset = idx === 0 ? 0 : (labelX - valueStartX);
          } else if (linePaddingOffsets[idx] !== undefined) {
            lineOffset = linePaddingOffsets[idx];
          }
          const exactX = Math.round(valueStartX + lineOffset);
          ctx.fillText(trimmedLine, exactX, yPos);
        });
        
        ctx.restore();
        
        lineIndex = lines.length - 1;
        currentYForLine = currentY + lineIndex * lineHeight;
      } else {
        const segments = value.split('|').map(s => s.trim());

        segments.forEach((segment, segIdx) => {
          if (segment.includes(':')) {
            const colonIndex = segment.indexOf(':');
            const embeddedLabel = segment.substring(0, colonIndex + 1).trim();
            const embeddedValue = segment.substring(colonIndex + 1).trim();
            
            const separator = segIdx > 0 ? ' | ' : '';
            const fullLabelText = `${separator}${embeddedLabel} `;
            
            ctx.font = `${fontSize}px ${fontFamily}`;
            const labelMetrics = ctx.measureText(fullLabelText);
            
            if (currentX + labelMetrics.width > rightEdge && segIdx > 0) {
              lineIndex += 1;
              currentYForLine = currentY + lineIndex * lineHeight;
              let lineOffset = 0;
              if (isPollingStationAddress) {
                lineOffset = lineIndex === 0 ? 0 : (labelX - valueStartX);
              } else if (linePaddingOffsets[lineIndex] !== undefined) {
                lineOffset = linePaddingOffsets[lineIndex];
              }
              currentX = Math.round(valueStartX + lineOffset);
              ctx.fillText(`${embeddedLabel} `, currentX, currentYForLine);
              currentX += ctx.measureText(`${embeddedLabel} `).width;
            } else {
              ctx.fillText(fullLabelText, currentX, currentYForLine);
              currentX += labelMetrics.width;
            }
            
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const valueMetrics = ctx.measureText(embeddedValue);
            
            if (currentX + valueMetrics.width > rightEdge) {
              lineIndex += 1;
              currentYForLine = currentY + lineIndex * lineHeight;
              let lineOffset = 0;
              if (isPollingStationAddress) {
                lineOffset = lineIndex === 0 ? 0 : (labelX - valueStartX);
              } else if (linePaddingOffsets[lineIndex] !== undefined) {
                lineOffset = linePaddingOffsets[lineIndex];
              }
              currentX = Math.round(valueStartX + lineOffset);
            }
            
            ctx.fillText(embeddedValue, currentX, currentYForLine);
            currentX += valueMetrics.width;
          } else {
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            const separator = segIdx > 0 ? ' | ' : '';
            const words = segment.split(' ').filter(w => w.length > 0);
            let lineWords: string[] = [];
            
            words.forEach((word) => {
              const testWords = [...lineWords, word];
              const testLine = testWords.join(' ');
              const prefix = segIdx > 0 && lineWords.length === 0 ? separator : '';
              const fullTestLine = `${prefix}${testLine}`;
              const testX = lineWords.length === 0 ? (segIdx > 0 ? currentX : valueStartX) : currentX;
              const metrics = ctx.measureText(fullTestLine);
              
              const testWidth = testX === valueStartX ? availableWidth : (rightEdge - testX);
              if (metrics.width > testWidth && lineWords.length > 0) {
                const lineToDraw = lineWords.join(' ').trim();
                let currentLineOffset = 0;
                if (isPollingStationAddress) {
                  currentLineOffset = lineIndex === 0 ? 0 : (labelX - valueStartX);
                } else if (linePaddingOffsets[lineIndex] !== undefined) {
                  currentLineOffset = linePaddingOffsets[lineIndex];
                }
                ctx.fillText(lineToDraw, Math.round(valueStartX + currentLineOffset), currentYForLine);
                lineIndex += 1;
                currentYForLine = currentY + lineIndex * lineHeight;
                let nextLineOffset = 0;
                if (isPollingStationAddress) {
                  nextLineOffset = lineIndex === 0 ? 0 : (labelX - valueStartX);
                } else if (linePaddingOffsets[lineIndex] !== undefined) {
                  nextLineOffset = linePaddingOffsets[lineIndex];
                }
                currentX = Math.round(valueStartX + nextLineOffset);
                lineWords = [word];
              } else {
                lineWords.push(word);
                if (lineWords.length === 1 && segIdx === 0) {
                  let firstLineOffset = 0;
                  if (isPollingStationAddress) {
                    firstLineOffset = lineIndex === 0 ? 0 : (labelX - valueStartX);
                  } else if (linePaddingOffsets[lineIndex] !== undefined) {
                    firstLineOffset = linePaddingOffsets[lineIndex];
                  }
                  currentX = Math.round(valueStartX + firstLineOffset);
                }
              }
            });
            
            if (lineWords.length > 0) {
              const lineToDraw = lineWords.join(' ').trim();
              const lineMetrics = ctx.measureText(lineToDraw);
              
              let lastLineOffset = 0;
              if (isPollingStationAddress) {
                lastLineOffset = lineIndex === 0 ? 0 : (labelX - valueStartX);
              } else if (linePaddingOffsets[lineIndex] !== undefined) {
                lastLineOffset = linePaddingOffsets[lineIndex];
              }
              const lastLineX = Math.round(valueStartX + lastLineOffset);
              ctx.fillText(lineToDraw, lastLineX, currentYForLine);
              currentX = lastLineX + lineMetrics.width;
            }
          }
        });
      }

      const totalLines = lineIndex + 1;
      if (totalLines === 1) {
        currentY += lineHeight;
      } else {
        currentY += (lineIndex + 1) * lineHeight;
      }
    });

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.92 });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `inline; filename="campaign-${ward}-${voterDetails.epic || 'voter'}.jpg"`,
      },
    });
  } catch (error) {
    console.error('Error generating campaign image:', error);
    return NextResponse.json(
      { error: 'Failed to generate campaign image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
