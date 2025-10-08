'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { getUserVotes, toggleVote as toggleVoteFirestore } from '@/utils/firestore';

interface VoteState {
  [submissionId: string]: {
    count: number;
    hasVoted: boolean;
  };
}

export function useVotes(user: User | null, submissionIds: string[]) {
  const [voteStates, setVoteStates] = useState<VoteState>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || submissionIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchUserVotes = async () => {
      try {
        const votedSubmissionIds = await getUserVotes(user.uid, submissionIds);
        const votedIds = new Set(votedSubmissionIds);

        setVoteStates(prev => {
          const updated = { ...prev };
          submissionIds.forEach(id => {
            if (updated[id]) {
              updated[id] = {
                ...updated[id],
                hasVoted: votedIds.has(id)
              };
            }
          });
          return updated;
        });
      } catch (error) {
        console.error('Error fetching user votes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserVotes();
  }, [user, submissionIds.join(',')]);

  const initializeVote = useCallback((submissionId: string, initialCount: number) => {
    setVoteStates(prev => {
      if (prev[submissionId]) {
        return prev;
      }
      return {
        ...prev,
        [submissionId]: {
          count: initialCount,
          hasVoted: false
        }
      };
    });
  }, []);

  const toggleVote = useCallback(async (submissionId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const currentState = voteStates[submissionId];
    if (!currentState) {
      return { success: false, error: 'Submission not initialized' };
    }

    const optimisticHasVoted = !currentState.hasVoted;
    const optimisticCount = currentState.hasVoted
      ? currentState.count - 1
      : currentState.count + 1;

    setVoteStates(prev => ({
      ...prev,
      [submissionId]: {
        count: optimisticCount,
        hasVoted: optimisticHasVoted
      }
    }));

    try {
      const result = await toggleVoteFirestore(user.uid, submissionId);

      setVoteStates(prev => ({
        ...prev,
        [submissionId]: {
          count: result.voteCount,
          hasVoted: result.voted
        }
      }));

      return { success: true };
    } catch (error) {
      setVoteStates(prev => ({
        ...prev,
        [submissionId]: currentState
      }));

      console.error('Error toggling vote:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle vote'
      };
    }
  }, [user, voteStates]);

  const getVoteCount = useCallback((submissionId: string): number => {
    return voteStates[submissionId]?.count || 0;
  }, [voteStates]);

  const hasUserVoted = useCallback((submissionId: string): boolean => {
    return voteStates[submissionId]?.hasVoted || false;
  }, [voteStates]);

  return {
    toggleVote,
    getVoteCount,
    hasUserVoted,
    initializeVote,
    isLoading
  };
}
