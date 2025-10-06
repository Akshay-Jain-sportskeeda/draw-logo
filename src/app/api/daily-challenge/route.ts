import { NextRequest, NextResponse } from 'next/server';

interface DailyChallengeData {
  date: string;
  memory: string;
  freeDraw: string;
}

interface DailyChallengeResponse {
  date: string;
  memoryChallenge: {
    name: string;
    logoUrl: string;
  };
  freeDrawChallenge: {
    name: string;
    imageUrl: string;
  };
}

function parseCSV(csvText: string): DailyChallengeData[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const dateIndex = headers.indexOf('date');
  const memoryIndex = headers.indexOf('memory');
  const freeDrawIndex = headers.indexOf('freedraw');
  
  if (dateIndex === -1 || memoryIndex === -1 || freeDrawIndex === -1) {
    throw new Error('Required columns (date, memory, freeDraw) not found in CSV');
  }
  
  const data: DailyChallengeData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    
    if (row.length > Math.max(dateIndex, memoryIndex, freeDrawIndex)) {
      data.push({
        date: row[dateIndex],
        memory: row[memoryIndex],
        freeDraw: row[freeDrawIndex]
      });
    }
  }
  
  return data;
}

function getTodayDateString(): string {
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
}

function extractTeamNameFromUrl(url: string): string {
  // Try to extract team name from NFL logo URLs
  const patterns = [
    /\/([^\/]+)\.png$/i,
    /\/([^\/]+)\.jpg$/i,
    /\/([^\/]+)\.jpeg$/i,
    /\/([^\/]+)\.svg$/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  
  return 'NFL Team';
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== DAILY CHALLENGE API DEBUG START ===');
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7nrMO_OwQwUiSf4fLtayPTpGaY2R-t6V0R730q-gR0nuis-VWxy2NaG3UsndWq41S66mLqte7ICks/pub?gid=0&single=true&output=csv';
    
    console.log('Fetching CSV from:', csvUrl);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV fetched successfully, length:', csvText.length);
    console.log('First 200 characters:', csvText.substring(0, 200));
    
    const challengeData = parseCSV(csvText);
    console.log('Parsed CSV data, rows:', challengeData.length);
    console.log('Sample rows:', challengeData.slice(0, 3));
    
    const todayDate = getTodayDateString();
    console.log('Looking for date:', todayDate);
    
    const todayChallenge = challengeData.find(row => row.date === todayDate);
    
    if (!todayChallenge) {
      console.log('No challenge found for today, available dates:', challengeData.map(row => row.date));
      
      // Fallback to the first available challenge
      if (challengeData.length > 0) {
        const fallbackChallenge = challengeData[0];
        console.log('Using fallback challenge:', fallbackChallenge);
        
        const response: DailyChallengeResponse = {
          date: fallbackChallenge.date,
          memoryChallenge: {
            name: extractTeamNameFromUrl(fallbackChallenge.memory),
            logoUrl: fallbackChallenge.memory
          },
          freeDrawChallenge: {
            name: 'Creative Template',
            imageUrl: fallbackChallenge.freeDraw
          }
        };
        
        return NextResponse.json(response);
      }
      
      return NextResponse.json(
        { error: `No challenge found for ${todayDate}` },
        { status: 404 }
      );
    }
    
    console.log('Found challenge for today:', todayChallenge);
    
    const response: DailyChallengeResponse = {
      date: todayChallenge.date,
      memoryChallenge: {
        name: extractTeamNameFromUrl(todayChallenge.memory),
        logoUrl: todayChallenge.memory
      },
      freeDrawChallenge: {
        name: 'Creative Template',
        imageUrl: todayChallenge.freeDraw
      }
    };
    
    console.log('Returning response:', response);
    console.log('=== DAILY CHALLENGE API DEBUG END ===');
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('=== DAILY CHALLENGE API ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('=== END DAILY CHALLENGE API ERROR ===');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch daily challenge',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}