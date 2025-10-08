import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drawingData, userId, fileName } = body;

    if (!drawingData || !userId || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: drawingData, userId, or fileName' },
        { status: 400 }
      );
    }

    if (!drawingData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data format' },
        { status: 400 }
      );
    }

    const base64Data = drawingData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      },
      public: true,
    });

    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json({
      success: true,
      publicUrl
    });

  } catch (error) {
    console.error('Upload error:', error);

    let errorMessage = 'Failed to upload image';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
