import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const { submissionIds } = await request.json();

    if (!submissionIds || !Array.isArray(submissionIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid submissionIds array' },
        { status: 400 }
      );
    }

    const votedSubmissionIds: string[] = [];

    for (const submissionId of submissionIds) {
      const voteDocId = `${userId}_${submissionId}`;
      const voteDoc = await adminDb.collection('submission-votes').doc(voteDocId).get();

      if (voteDoc.exists) {
        votedSubmissionIds.push(submissionId);
      }
    }

    return NextResponse.json({
      success: true,
      votedSubmissionIds
    });

  } catch (error) {
    console.error('Error fetching user votes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
