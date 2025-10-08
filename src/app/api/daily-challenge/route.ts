import { NextRequest, NextResponse } from 'next/server';

interface DailyChallengeData {
  date: string;
  memoryTitle: string;
  memoryImg: string;
  freeDrawTitle: string;
  freeDrawImg: string;
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
  const memoryTitleIndex = headers.indexOf('memorytitle');
  const memoryImgIndex = headers.indexOf('memoryimg');
  const freeDrawTitleIndex = headers.indexOf('freedrawtitle');
  const freeDrawImgIndex = headers.indexOf('freedrawimg');
  
  if (dateIndex === -1 || memoryTitleIndex === -1 || memoryImgIndex === -1 || freeDrawTitleIndex === -1 || freeDrawImgIndex === -1) {
    throw new Error('Required columns (date, memoryTitle, memoryImg, freeDrawTitle, freeDrawImg) not found in CSV');
  }
  
  const data: DailyChallengeData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    
    if (row.length > Math.max(dateIndex, memoryTitleIndex, memoryImgIndex, freeDrawTitleIndex, freeDrawImgIndex)) {
      // Parse the date from MM-DD-YYYY format to YYYY-MM-DD format
      const rawDate = row[dateIndex];
      let formattedDate = rawDate;
      
      // Check if the date is in MM-DD-YYYY format and convert to YYYY-MM-DD
      const mmddyyyyMatch = rawDate.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (mmddyyyyMatch) {
        const [, month, day, year] = mmddyyyyMatch;
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      data.push({
        date: formattedDate,
        memoryTitle: row[memoryTitleIndex],
        memoryImg: row[memoryImgIndex],
        freeDrawTitle: row[freeDrawTitleIndex],
        freeDrawImg: row[freeDrawImgIndex]
      });
    }
  }
  
  return data;
}

function getTodayDateString(): string {
  // Use local timezone to match user's system date
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== DAILY CHALLENGE API DEBUG START ===');
    
    const { searchParams } = new URL(request.url);
    const requestedDate = searchParams.get('date');
    const getAllPuzzles = searchParams.get('all') === 'true';
    
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
    
    // If requesting all puzzles, return simplified list
    if (getAllPuzzles) {
      console.log('Returning all available puzzles');
      const puzzleList = challengeData.map(row => ({
        date: row.date,
        name: row.memoryTitle
      }));
      console.log('Puzzle list:', puzzleList.slice(0, 5));
      return NextResponse.json(puzzleList);
    }
    
    // Determine which date to look for
    const targetDate = requestedDate || getTodayDateString();
    console.log('Looking for date:', targetDate);
    
    const targetChallenge = challengeData.find(row => row.date === targetDate);
    
    if (!targetChallenge) {
      console.log(`No challenge found for ${targetDate}, available dates:`, challengeData.map(row => row.date));
      
      // Fallback to the first available challenge only if looking for today
      if (!requestedDate && challengeData.length > 0) {
        const fallbackChallenge = challengeData[0];
        console.log('Using fallback challenge:', fallbackChallenge);
        
        const challengeResponse: DailyChallengeResponse = {
          date: fallbackChallenge.date,
          memoryChallenge: {
            name: fallbackChallenge.memoryTitle,
            logoUrl: fallbackChallenge.memoryImg
          },
          freeDrawChallenge: {
            name: fallbackChallenge.freeDrawTitle,
            imageUrl: fallbackChallenge.freeDrawImg
          }
        };
        
        return NextResponse.json(challengeResponse);
      }
      
      return NextResponse.json(
        { error: `No challenge found for ${targetDate}` },
        { status: 404 }
      );
    }
    
    console.log(`Found challenge for ${targetDate}:`, targetChallenge);
    
    const challengeResponse: DailyChallengeResponse = {
      date: targetChallenge.date,
      memoryChallenge: {
        name: targetChallenge.memoryTitle,
        logoUrl: targetChallenge.memoryImg
      },
      freeDrawChallenge: {
        name: targetChallenge.freeDrawTitle,
        imageUrl: targetChallenge.freeDrawImg
      }
    };
    
    console.log('Returning response:', challengeResponse);
    console.log('=== DAILY CHALLENGE API DEBUG END ===');
    
    return NextResponse.json(challengeResponse);
    
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