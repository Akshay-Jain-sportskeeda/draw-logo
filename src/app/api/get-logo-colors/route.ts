import { NextRequest, NextResponse } from 'next/server';
import Jimp from 'jimp';

interface ColorCount {
  color: string;
  count: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function quantizeColor(r: number, g: number, b: number, factor: number = 32): string {
  // Quantize colors to reduce similar shades
  const qR = Math.round(r / factor) * factor;
  const qG = Math.round(g / factor) * factor;
  const qB = Math.round(b / factor) * factor;
  return rgbToHex(Math.min(255, qR), Math.min(255, qG), Math.min(255, qB));
}

function getColorDistance(color1: string, color2: string): number {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2));
}

function filterSimilarColors(colors: ColorCount[], minDistance: number = 100): ColorCount[] {
  const filtered: ColorCount[] = [];
  
  for (const color of colors) {
    let isSimilar = false;
    for (const filteredColor of filtered) {
      if (getColorDistance(color.color, filteredColor.color) < minDistance) {
        isSimilar = true;
        // Keep the one with higher count
        if (color.count > filteredColor.count) {
          const index = filtered.indexOf(filteredColor);
          filtered[index] = color;
        }
        break;
      }
    }
    if (!isSimilar) {
      filtered.push(color);
    }
  }
  
  return filtered;
}

export async function POST(request: NextRequest) {
  let logoUrl: string | undefined;
  
  try {
    console.log('=== COLOR EXTRACTION DEBUG START ===');
    
    const requestData = await request.json();
    logoUrl = requestData.logoUrl;
    console.log('STEP 1: Request parsed successfully');
    console.log('Logo URL:', logoUrl);

    if (!logoUrl) {
      console.log('ERROR: Missing logo URL in request');
      return NextResponse.json(
        { error: 'Missing logo URL' },
        { status: 400 }
      );
    }

    console.log('STEP 2: Starting fetch request to:', logoUrl);

    // Fetch the logo image explicitly
    const response = await fetch(logoUrl);
    console.log('STEP 3: Fetch completed');
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      console.log('ERROR: Fetch response not OK');
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    console.log('STEP 4: Converting to array buffer...');
    const imageBuffer = await response.arrayBuffer();
    console.log('STEP 5: Buffer created, size:', imageBuffer.byteLength, 'bytes');
    
    // Load the logo image from buffer
    console.log('STEP 6: Loading image with Jimp...');
    const image = await Jimp.read(Buffer.from(imageBuffer));
    console.log('STEP 7: Image loaded successfully');
    console.log('Original dimensions:', image.bitmap.width, 'x', image.bitmap.height);
    
    // Resize for faster processing
    console.log('STEP 8: Resizing image...');
    image.resize(100, 100);
    console.log('STEP 9: Image resized to 100x100');
    
    const colorCounts: { [key: string]: number } = {};
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    console.log('STEP 10: Starting pixel sampling...');
    
    // Sample pixels and count colors
    let pixelsProcessed = 0;
    for (let x = 0; x < width; x += 2) { // Skip every other pixel for performance
      for (let y = 0; y < height; y += 2) {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        
        // Skip very transparent pixels
        if (pixel.a < 128) {
          continue;
        }
        
        // Quantize the color to group similar shades
        const quantizedColor = quantizeColor(pixel.r, pixel.g, pixel.b);
        
        colorCounts[quantizedColor] = (colorCounts[quantizedColor] || 0) + 1;
        pixelsProcessed++;
      }
    }
    console.log('STEP 11: Pixel sampling complete');
    console.log('Pixels processed:', pixelsProcessed);
    console.log('Unique colors found:', Object.keys(colorCounts).length);
    
    // Convert to array and sort by frequency
    console.log('STEP 12: Converting to array and sorting...');
    let colorArray: ColorCount[] = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count);
    console.log('STEP 13: Color array created, length:', colorArray.length);
    console.log('Top 5 colors:', colorArray.slice(0, 5));
    
    // Filter out colors that are used in less than 5% of pixels
    console.log('STEP 13.5: Filtering colors by pixel percentage...');
    const minPixelThreshold = 0.02; // 2%
    const minPixelCount = Math.ceil(pixelsProcessed * minPixelThreshold);
    console.log('Minimum pixel count threshold (2%):', minPixelCount, 'out of', pixelsProcessed);
    
    const beforeFilterCount = colorArray.length;
    colorArray = colorArray.filter(color => color.count >= minPixelCount);
    console.log('Colors before percentage filter:', beforeFilterCount);
    console.log('Colors after percentage filter:', colorArray.length);
    console.log('Filtered colors:', colorArray.slice(0, 8));
    
    // Filter out very similar colors
    console.log('STEP 14: Filtering similar colors...');
    colorArray = filterSimilarColors(colorArray);
    console.log('STEP 15: After similarity filtering, length:', colorArray.length);
    
    // Always include black and white as they're commonly needed
    console.log('STEP 16: Checking for black and white...');
    const hasBlack = colorArray.some(c => getColorDistance(c.color, '#000000') < 30);
    const hasWhite = colorArray.some(c => getColorDistance(c.color, '#ffffff') < 30);
    console.log('Has black:', hasBlack, 'Has white:', hasWhite);
    
    // Only add black and white if they are naturally present in the logo
    if (hasBlack) {
      console.log('Black color naturally present in logo');
    }
    if (hasWhite) {
      console.log('White color naturally present in logo');
    }
    
    // Take top 8 colors
    console.log('STEP 17: Selecting final colors...');
    const topColors = colorArray.slice(0, 8).map(c => c.color);
    console.log('STEP 18: Final color palette:', topColors);
    
    console.log('=== COLOR EXTRACTION SUCCESS ===');
    return NextResponse.json({ colors: topColors });
  } catch (error) {
    console.log('=== COLOR EXTRACTION ERROR ===');
    console.error('Full error object:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Logo URL that failed:', logoUrl);
    
    // Robust error message and type extraction
    let errorMessage: string;
    let errorType: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.constructor.name;
    } else if (typeof error === 'string') {
      errorMessage = error;
      errorType = 'StringError';
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
      errorType = 'ObjectError';
    } else {
      errorMessage = 'Unknown error occurred - unable to extract error details';
      errorType = 'UnknownError';
    }
    
    console.error('Processed error message:', errorMessage);
    console.error('Processed error type:', errorType);
    
    return NextResponse.json(
      { 
        error: `Color extraction failed: ${errorMessage}`,
        errorType,
        logoUrl,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}