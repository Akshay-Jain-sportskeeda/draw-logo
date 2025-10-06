import React from 'react'
import { WinStats } from '@/types/game'
import styles from './WinScreen.module.css'
import { User } from 'firebase/auth'

interface WinScreenProps {
  stats: WinStats
  score: number
  accuracyScore: number
  timeScore: number
  onShare: () => void
  onArchive: () => void
  onClose: () => void
  show: boolean
  user: User | null
  onLoginClick: () => void
}

const WinScreen: React.FC<WinScreenProps> = ({
  stats,
  score,
  accuracyScore,
  timeScore,
  onShare,
  onArchive,
  onClose,
  show,
  user,
  onLoginClick
}) => {
  const handleLeaderboardClick = () => {
    if (!user) {
      onLoginClick()
    } else {
      // Close the win screen first
      onClose()
      // Small delay to ensure win screen closes, then navigate
      setTimeout(() => {
        // This will be handled by the parent component
        window.dispatchEvent(new CustomEvent('navigateToLeaderboard'))
      }, 100)
    }
  }

  const handleArchiveClick = () => {
    onArchive()
  }
  return (
    <div className={`${styles.winScreen} ${show ? styles.show : ''}`}>
      <div className={styles.winContent}>
        <button className={styles.closeButton} onClick={onClose} type="button" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div className={styles.winBannerContainer}>
          <div className={styles.winBanner}>🎉 Congratulations!</div>
          <div className={styles.winSubtitle}>Your Performance</div>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Accuracy Score</div>
            <span className={styles.statValue}>{Math.round(accuracyScore)}%</span>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Time Score</div>
            <span className={styles.statValue}>{Math.round(timeScore)}%</span>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statRow}>
              <div className={styles.statLabel}>Final Score</div>
              <span className={styles.statValue}>{score}%</span>
            </div>
            <div className={styles.timeBreakdown}>
              <div className={styles.penaltyText}>Time: {stats.displayTime}</div>
              <div className={styles.calculationText}>60% accuracy + 40% time</div>
            </div>
          </div>
        </div>
        
        <div className={styles.primaryAction}>
          <button className={`${styles.winBtn} ${styles.leaderboard} ${user ? styles.loggedIn : ''}`} onClick={handleLeaderboardClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            {user ? 'View Leaderboard' : 'Login to view your Rank'}
          </button>
        </div>
        
        <div className={styles.winActions}>
          <button className={`${styles.winBtn} ${styles.share}`} onClick={onShare}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Share
          </button>
          <button className={`${styles.winBtn} ${styles.archive}`} onClick={handleArchiveClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21,8 21,21 3,21 3,8"/>
              <rect x="1" y="3" width="22" height="5"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            Play&nbsp;Archive
          </button>
        </div>
      </div>
    </div>
  )
}

export default WinScreen
