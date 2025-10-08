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
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    const voteDocId = `${userId}_${submissionId}`;
    const voteDocRef = adminDb.collection('submission-votes').doc(voteDocId);
    const submissionRef = adminDb.collection('nfl-draw-logo').doc(submissionId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const voteDoc = await transaction.get(voteDocRef);
      const submissionDoc = await transaction.get(submissionRef);

      if (!submissionDoc.exists) {
        throw new Error('Submission not found');
      }

      const submissionData = submissionDoc.data();
      const currentVotes = submissionData?.votes || 0;

      if (voteDoc.exists) {
        transaction.delete(voteDocRef);
        transaction.update(submissionRef, {
          votes: Math.max(0, currentVotes - 1)
        });
        return {
          voted: false,
          voteCount: Math.max(0, currentVotes - 1)
        };
      } else {
        transaction.set(voteDocRef, {
          userId,
          submissionId,
          timestamp: Date.now()
        });
        transaction.update(submissionRef, {
          votes: currentVotes + 1
        });
        return {
          voted: true,
          voteCount: currentVotes + 1
        };
      }
    });

    return NextResponse.json({
      success: true,
      voted: result.voted,
      voteCount: result.voteCount
    });

  } catch (error) {
    console.error('Error toggling vote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle vote' },
      { status: 500 }
    );
  }
}
