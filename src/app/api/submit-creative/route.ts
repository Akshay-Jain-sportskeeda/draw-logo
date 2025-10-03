import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage, getAdminDatabase } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { drawingData, userName, gameMode } = await request.json();

    if (!drawingData) {
      return NextResponse.json(
        { error: 'Missing drawing data' },
        { status: 400 }
      );
    }

    const base64Data = drawingData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileName = `creative-remix/${timestamp}-${randomString}.png`;

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    const database = getAdminDatabase();
    const submissionsRef = database.ref('nfl-draw-logo');
    const newSubmissionRef = submissionsRef.push();

    const submissionData = {
      drawingUrl: publicUrl,
      userName: userName || 'Anonymous',
      timestamp: Date.now(),
      status: 'pending',
      rating: null,
      gameMode: gameMode || 'creative-remix',
      adminNotes: ''
    };

    await newSubmissionRef.set(submissionData);

    return NextResponse.json({
      success: true,
      submissionId: newSubmissionRef.key,
      drawingUrl: publicUrl
    });
  } catch (error) {
    console.error('Error submitting creative drawing:', error);
    return NextResponse.json(
      { error: 'Failed to submit drawing' },
      { status: 500 }
    );
  }
}
