import React, { useState, useEffect } from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { trackArchiveView, trackArchivePuzzleLoad, trackModalOpen, trackModalClose } from '../utils/analytics';
import { useLeaderboard } from '../lib/useLeaderboard';
import styles from './ArchiveScreen.module.css';

interface ArchiveScreenProps {
  show?: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  userId?: string;
  availablePuzzles?: { date: string; name: string }[];
}

const ArchiveScreen: React.FC<ArchiveScreenProps> = ({ 
  show = true,
  onClose, 
  onSelectDate, 
  userId,
  availablePuzzles: propAvailablePuzzles
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [availablePuzzles, setAvailablePuzzles] = useState<{date: string; name: string}[]>([]);
  const { getUserCompletedDates } = useLeaderboard();

  // Lock/unlock body scroll when modal opens/closes
  React.useEffect(() => {
    trackModalOpen('archive');
    document.body.style.overflow = 'hidden';

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Track archive popup view
    trackArchiveView();
    
    // Fetch available puzzles if not provided via props
    const fetchAvailablePuzzles = async () => {
      if (propAvailablePuzzles) {
        setAvailablePuzzles(propAvailablePuzzles);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/daily-challenge?all=true');
        if (response.ok) {
          const puzzles = await response.json();
          setAvailablePuzzles(puzzles);
        } else {
          console.error('Failed to fetch available puzzles');
        }
      } catch (error) {
        console.error('Error fetching available puzzles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailablePuzzles();
  }, [propAvailablePuzzles]);

  useEffect(() => {
    const fetchCompletedDates = async () => {
      if (userId && getUserCompletedDates) {
        try {
          const dates = await getUserCompletedDates(userId);
          setCompletedDates(dates);
        } catch (error) {
          console.error('Error fetching completed dates:', error);
        }
      }
    };
    
    fetchCompletedDates();
  }, [userId, getUserCompletedDates]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayMonth: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      };
    } catch (error) {
      return { dayOfWeek: 'Invalid', dayMonth: 'Date' };
    }
  };

  const handleDateSelect = (date: string) => {
    // Track archive puzzle selection
    trackArchivePuzzleLoad(date, true);
    onSelectDate(date);
    
    // Scroll to top after selecting archive game
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const isDateCompleted = (date: string) => completedDates.includes(date);

  // Filter out future dates - only show today and past dates
  const today = new Date().toISOString().split('T')[0];
  const filteredPuzzles = availablePuzzles.filter(puzzle => puzzle.date <= today);
  return (
    <div className={`${styles.archiveScreen} ${show ? styles.show : ''}`}>
      <div className={styles.archiveContent}>
        <div className={styles.archiveHeader}>
          <button className={styles.archiveCloseX} onClick={onClose} type="button" aria-label="Close">
            <X size={24} />
          </button>
          
          <div className={styles.archiveTitle}>
            <Calendar size={24} />
            Archive Games
          </div>
          <div className={styles.archiveSubtitle}>Select a previous day to play</div>
        </div>
        
        <div className={styles.archiveContentBody}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading available puzzles...</p>
            </div>
          ) : filteredPuzzles.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p className={styles.emptyText}>No archive puzzles available</p>
            </div>
          ) : (
            <div className={styles.archiveDates}>
              {/* Today's Game */}
              <button
                onClick={() => handleDateSelect(new Date().toISOString().split('T')[0])}
                className={`${styles.dateItem} ${styles.todayItem}`}
              >
                {isDateCompleted(new Date().toISOString().split('T')[0]) && (
                  <div className={styles.completionTick}>
                    <Check size={12} />
                  </div>
                )}
                <div className={styles.dateDay}>Today</div>
                <div className={styles.dateNumber}>
                  {(() => {
                    const today = new Date();
                    return today.toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'short' 
                    });
                  })()}
                </div>
              </button>
              
              {filteredPuzzles.map((puzzle) => {
                const { dayOfWeek, dayMonth } = formatDate(puzzle.date);
                const isCompleted = isDateCompleted(puzzle.date);
                const isToday = puzzle.date === today;
                
                // Skip today's puzzle since we show it separately
                if (isToday) return null;
                
                return (
                  <button
                    key={puzzle.date}
                    onClick={() => handleDateSelect(puzzle.date)}
                    className={styles.dateItem}
                  >
                    {isCompleted && (
                      <div className={styles.completionTick}>
                        <Check size={12} />
                      </div>
                    )}
                    <div className={styles.dateDay}>{dayOfWeek}</div>
                    <div className={styles.dateNumber}>{dayMonth}</div>
                  </button>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveScreen;