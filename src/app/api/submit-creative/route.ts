import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage, getAdminDatabase, getAdminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    
    try {
      const adminAuth = getAdminAuth();
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

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
      userName: userName || decodedToken.name || decodedToken.email?.split('@')[0] || 'Anonymous',
      userId: decodedToken.uid,
      userEmail: decodedToken.email,
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
