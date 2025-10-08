import { NextRequest, NextResponse } from 'next/server';
import Jimp from 'jimp';
import { ssim } from 'ssim.js';

// Helper function to determine if a pixel is background
function isBackgroundPixel(r: number, g: number, b: number, a: number): boolean {
  // Consider transparent pixels as background
  if (a < 128) return true;
  
  // Consider white or near-white pixels as background (for user drawings)
  const threshold = 240;
  return r >= threshold && g >= threshold && b >= threshold;
}

// Helper function to find bounding box of non-background content
function findContentBounds(image: any): { minX: number, minY: number, maxX: number, maxY: number } | null {
  const { width, height, data } = image.bitmap;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (!isBackgroundPixel(r, g, b, a)) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return hasContent ? { minX, minY, maxX, maxY } : null;
}

// Preprocess image with Jimp
async function preprocess(imageBuffer: Buffer, size = 64) {
  const image = await Jimp.read(imageBuffer);
  image.resize(size, size);
  
  console.log(`Original resized image: ${image.bitmap.width}x${image.bitmap.height}`);
  
  // Find content bounds
  const bounds = findContentBounds(image);
  
  let processedImage: any;
  let activePixelCount = 0;
  
  if (!bounds) {
    console.log('No content found, using blank white image');
    // No content found, create blank white image
    processedImage = new Jimp(size, size, '#ffffff');
    activePixelCount = 0;
  } else {
    console.log(`Content bounds: (${bounds.minX}, ${bounds.minY}) to (${bounds.maxX}, ${bounds.maxY})`);
    
    // Calculate content dimensions
    const contentWidth = bounds.maxX - bounds.minX + 1;
    const contentHeight = bounds.maxY - bounds.minY + 1;
    console.log(`Content dimensions: ${contentWidth}x${contentHeight}`);
    
    // Crop to content bounds
    const croppedImage = image.crop(bounds.minX, bounds.minY, contentWidth, contentHeight);
    console.log(`Cropped image: ${croppedImage.bitmap.width}x${croppedImage.bitmap.height}`);
    
    // Create new blank image with white background
    processedImage = new Jimp(size, size, '#ffffff');
    
    // Calculate position to center the cropped content
    const offsetX = Math.floor((size - contentWidth) / 2);
    const offsetY = Math.floor((size - contentHeight) / 2);
    console.log(`Centering offset: (${offsetX}, ${offsetY})`);
    
    // Paste cropped content onto the centered position
    processedImage.composite(croppedImage, offsetX, offsetY);
    
    // Count active pixels in the final processed image
    const { data } = processedImage.bitmap;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (!isBackgroundPixel(r, g, b, a)) {
        activePixelCount++;
      }
    }
  }
  
  const { data, width, height } = processedImage.bitmap;

  // Create grayscale array for pixel diff and edge detection
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    // Convert RGBA to grayscale using luminance formula
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return { gray, width, height, rgbaData: data, activePixelCount };
}

// Helper function to calculate Jaccard Index (Intersection over Union)
function calculateBinarySimilarity(userData: Uint8Array, targetData: Uint8Array, threshold: number) {
  let truePositives = 0;  // Both have content
  let falsePositives = 0; // User has content, target doesn't
  let falseNegatives = 0; // Target has content, user doesn't
  
  for (let i = 0; i < userData.length; i++) {
    const userHasContent = userData[i] < threshold; // For grayscale: darker = content
    const targetHasContent = targetData[i] < threshold;
    
    if (userHasContent && targetHasContent) {
      truePositives++;
    } else if (userHasContent && !targetHasContent) {
      falsePositives++;
    } else if (!userHasContent && targetHasContent) {
      falseNegatives++;
    }
    // True negatives (both background) don't affect Jaccard Index
  }
  
  const union = truePositives + falsePositives + falseNegatives;
  if (union === 0) {
    // Both images are completely blank
    return 100;
  }
  
  const jaccardIndex = truePositives / union;
  return jaccardIndex * 100;
}

// Helper function for edge similarity using Jaccard Index
function calculateEdgeSimilarity(userEdges: Uint8Array, targetEdges: Uint8Array, threshold: number) {
  let truePositives = 0;  // Both have edges
  let falsePositives = 0; // User has edge, target doesn't
  let falseNegatives = 0; // Target has edge, user doesn't
  
  for (let i = 0; i < userEdges.length; i++) {
    const userHasEdge = userEdges[i] > threshold; // For edges: higher = edge
    const targetHasEdge = targetEdges[i] > threshold;
    
    if (userHasEdge && targetHasEdge) {
      truePositives++;
    } else if (userHasEdge && !targetHasEdge) {
      falsePositives++;
    } else if (!userHasEdge && targetHasEdge) {
      falseNegatives++;
    }
    // True negatives (both no edge) don't affect Jaccard Index
  }
  
  const union = truePositives + falsePositives + falseNegatives;
  if (union === 0) {
    // Neither image has any edges
    return 100;
  }
  
  const jaccardIndex = truePositives / union;
  return jaccardIndex * 100;
}

// Pixel similarity using Jaccard Index
function pixelSimilarityScore(userGray: Uint8Array, targetGray: Uint8Array) {
  // Threshold of 220 means pixels darker than very light gray (< 220) are considered content
  return calculateBinarySimilarity(userGray, targetGray, 220);
}

// SSIM score
function ssimScore(userRgba: Uint8ClampedArray, targetRgba: Uint8ClampedArray, width: number, height: number) {
  // Create ImageData-like objects directly without canvas
  const userImg = {
    data: userRgba,
    width: width,
    height: height
  };
  
  const targetImg = {
    data: targetRgba,
    width: width,
    height: height
  };
  
  return ssim(userImg, targetImg).mssim * 100;
}

// Sobel edge detection (pure JS)
function sobelEdges(gray: Uint8Array, width: number, height: number) {
  const Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  const edges = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0, sumY = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = gray[(y + ky) * width + (x + kx)];
          sumX += Gx[ky + 1][kx + 1] * pixel;
          sumY += Gy[ky + 1][kx + 1] * pixel;
        }
      }
      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      edges[y * width + x] = Math.min(255, magnitude);
    }
  }
  return edges;
}

// Edge similarity
function edgeSimilarity(userEdges: Uint8Array, targetEdges: Uint8Array) {
  // Threshold of 15 means edge magnitudes > 15 are considered significant edges
  return calculateEdgeSimilarity(userEdges, targetEdges, 15);
}

// Final similarity
async function finalSimilarity(userBuffer: Buffer, targetBuffer: Buffer, size = 64) {
  console.log('=== SIMILARITY SCORING BREAKDOWN ===');
  
  const newSize = 256; // Increased from 64 to retain more detail
  const { gray: userGray, width, height, rgbaData: userRgba, activePixelCount: userActivePixelCount } = await preprocess(userBuffer, newSize);
  const { gray: targetGray, rgbaData: targetRgba } = await preprocess(targetBuffer, newSize);
  
  console.log(`Image dimensions: ${width}x${height} (${width * height} pixels)`);
  console.log(`User drawing active pixels: ${userActivePixelCount}`);
  
  // Calculate content density
  const totalPixels = width * height;
  const userContentDensity = userActivePixelCount / totalPixels;
  const MIN_CONTENT_DENSITY_THRESHOLD = 0.005; // 0.5% of total pixels
  
  console.log(`User content density: ${(userContentDensity * 100).toFixed(2)}% (${userActivePixelCount}/${totalPixels} pixels)`);
  console.log(`Minimum content density threshold: ${(MIN_CONTENT_DENSITY_THRESHOLD * 100).toFixed(2)}%`);
  
  // Check if user drawing has sufficient content
  if (userContentDensity < MIN_CONTENT_DENSITY_THRESHOLD) {
    console.log('INSUFFICIENT CONTENT DETECTED - Returning minimal score');
    console.log('User drawing does not meet minimum content density requirement');
    
    const minimalScore = 1;
    const breakdown = {
      pixelScore: 0,
      ssimScore: 0,
      edgeScore: 0,
      pixelContribution: 0,
      ssimContribution: 0,
      edgeContribution: 0
    };
    
    console.log(`\n--- FINAL RESULT (INSUFFICIENT CONTENT) ---`);
    console.log(`Minimal Score: ${minimalScore}%`);
    console.log('=====================================\n');
    
    return {
      totalScore: minimalScore,
      breakdown: breakdown
    };
  }

  // Calculate individual scores
  const rawPixelScore = pixelSimilarityScore(userGray, targetGray);
  const pixelScore = Math.min(100, rawPixelScore * 1.5); // Apply 1.5x leniency factor, cap at 100%
  console.log(`1. PIXEL SIMILARITY SCORE (Jaccard Index): ${rawPixelScore.toFixed(2)}% (raw) → ${pixelScore.toFixed(2)}% (with 1.5x leniency)`);
  console.log('   - Measures overlap of actual drawn content vs background (threshold: 220)');
  console.log('   - Uses Intersection over Union: TP / (TP + FP + FN)');
  console.log('   - TP=both have content, FP=extra marks, FN=missing content');
  console.log('   - Leniency factor of 1.5x applied to make scoring more forgiving');
  
  const ssimVal = ssimScore(userRgba, targetRgba, width, height);
  console.log(`2. SSIM (STRUCTURAL SIMILARITY) SCORE: ${ssimVal.toFixed(2)}%`);
  console.log('   - Measures perceptual similarity (luminance, contrast, structure)');
  console.log('   - Better correlates with human visual perception');

  const userEdges = sobelEdges(userGray, width, height);
  const targetEdges = sobelEdges(targetGray, width, height);
  const edgeScore = edgeSimilarity(userEdges, targetEdges);
  console.log(`3. EDGE MATCHING SCORE (Jaccard Index): ${edgeScore.toFixed(2)}%`);
  console.log('   - Compares detected edges using Sobel edge detection + Jaccard Index');
  console.log('   - Measures overlap of edge pixels: TP / (TP + FP + FN)');
  console.log('   - Focuses on shapes and outlines (threshold: 15 for softer hand-drawn edges)');

  // Calculate weighted contributions
  const pixelContribution = 0.70 * pixelScore;
  const ssimContribution = 0.00 * ssimVal;
  const edgeContribution = 0.30 * edgeScore;

  console.log('\n--- WEIGHTED CONTRIBUTIONS ---');
  console.log(`Pixel Score (70% weight): ${pixelScore.toFixed(2)}% × 0.70 = ${pixelContribution.toFixed(2)}`);
  console.log(`SSIM Score (0% weight): ${ssimVal.toFixed(2)}% × 0.00 = ${ssimContribution.toFixed(2)}`);
  console.log(`Edge Score (30% weight): ${edgeScore.toFixed(2)}% × 0.30 = ${edgeContribution.toFixed(2)}`);

  const finalScore = 0.70 * pixelScore + 0.00 * ssimVal + 0.30 * edgeScore;
  
  console.log(`\n--- FINAL RESULT ---`);
  console.log(`Combined Score: ${pixelContribution.toFixed(2)} + ${ssimContribution.toFixed(2)} + ${edgeContribution.toFixed(2)} = ${finalScore.toFixed(2)}%`);
  console.log(`Rounded Final Score: ${Math.round(finalScore)}%`);
  console.log('=====================================\n');
  
  return {
    totalScore: Math.round(finalScore),
    breakdown: {
      pixelScore: Math.round(pixelScore * 100) / 100,
      ssimScore: Math.round(ssimVal * 100) / 100,
      edgeScore: Math.round(edgeScore * 100) / 100,
      pixelContribution: Math.round(pixelContribution * 100) / 100,
      ssimContribution: Math.round(ssimContribution * 100) / 100,
      edgeContribution: Math.round(edgeContribution * 100) / 100
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { drawingData, targetLogoUrl } = await request.json();

    if (!drawingData || !targetLogoUrl) {
      return NextResponse.json(
        { error: 'Missing drawing data or target logo URL' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = drawingData.replace(/^data:image\/[a-z]+;base64,/, '');
    const drawingBuffer = Buffer.from(base64Data, 'base64');

    // Fetch the target logo explicitly
    const response = await fetch(targetLogoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch target logo: ${response.status} ${response.statusText}`);
    }
    const logoBuffer = await response.arrayBuffer();
    const targetBuffer = Buffer.from(logoBuffer);

    // Calculate similarity using the new hybrid method
    const result = await finalSimilarity(drawingBuffer, targetBuffer);

    return NextResponse.json({ 
      score: result.totalScore,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('Error scoring drawing:', error);
    return NextResponse.json(
      { error: 'Failed to score drawing' },
      { status: 500 }
    );
  }
}