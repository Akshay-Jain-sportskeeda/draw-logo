'use client';

import React, { useState } from 'react';
import styles from './PFSNHeader.module.css';

interface HeaderProps {
  currentGame?: string;
}

const PFSNHeader: React.FC<HeaderProps> = ({ currentGame = 'NFL Draw Logo' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Lock/unlock body scroll when mobile menu opens/closes
  React.useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isExpanded]);

  const nflGames = [
    { title: 'NFL Draw Logo', url: '/' },
    { title: 'NFL Player Guessing Game', url: 'https://www.profootballnetwork.com/nfl-player-guessing-game/' },
    { title: 'NFL Octobox', url: 'https://www.profootballnetwork.com/games/nfl-octobox/' },
    { title: 'NFL Duo', url: 'https://www.profootballnetwork.com/games/nfl-duo/' },
    { title: 'NFL Draft Guessing Game', url: 'https://www.profootballnetwork.com/nfl-draft-prospect-guessing-game/' },
    { title: 'NFL Word Search', url: 'https://www.profootballnetwork.com/nfl-wordsearch/' },
    { title: 'NFL Word Fumble', url: 'https://www.profootballnetwork.com/nfl-word-fumble-player-name-game/' },
  ];

  const nbaGames = [
    { title: 'NBA Player Guessing Game', url: 'https://www.profootballnetwork.com/nba-player-guessing-game/' },
    { title: 'NBA Duo', url: 'https://www.profootballnetwork.com/games/nba-duo/' },
  ];

  const nhlGames = [
    { title: 'NHL Duo', url: 'https://www.profootballnetwork.com/games/nhl-duo/' },
    { title: 'NHL Cards', url: 'https://www.profootballnetwork.com/nhlcards/' },
  ];

  const otherGames = [
    { title: 'MLB Duo', url: 'https://www.profootballnetwork.com/games/mlb-duo/' },
    { title: 'Tennis Duo', url: 'https://www.profootballnetwork.com/games/tennis-duo/' },
    { title: 'WWE Guessing Game', url: 'https://www.profootballnetwork.com/wwe-player-guessing-game/' },
  ];

  const allGames = [...nflGames, ...nbaGames, ...nhlGames, ...otherGames];
  return (
    <>
      <div className={styles.mobileHeader}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.hamburgerButton}
          aria-label="Toggle games menu"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
        <div className={styles.headerLogo}>
          <img src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg" alt="PFSN" className={styles.logoImage} />
        </div>
        <span className={styles.gameTitle}>{currentGame}</span>
      </div>

      {/* Slide-out menu and overlay */}
      {isExpanded && (
        <div className={styles.overlay} onClick={() => setIsExpanded(false)}></div>
      )}

      <div className={`${styles.slideMenu} ${isExpanded ? styles.slideMenuOpen : ''}`}>
        <div className={styles.menuSidebar}>
          <div className={styles.sidebarItem}>CBB</div>
          <div className={styles.sidebarItem}>CFB</div>
          <div className={`${styles.sidebarItem} ${styles.sidebarItemActive}`}>GAMES</div>
          <div className={styles.sidebarItem}>FANTASY</div>
          <div className={styles.sidebarItem}>MLB</div>
          <div className={styles.sidebarItem}>NASCAR</div>
          <div className={styles.sidebarItem}>NBA</div>
          <div className={styles.sidebarItem}>NFL</div>
          <div className={styles.sidebarItem}>NHL</div>
          <div className={styles.sidebarItem}>TENNIS</div>
          <div className={styles.sidebarItem}>WNBA</div>
          <div className={styles.sidebarItem}>WWE</div>
        </div>

        <div className={styles.menuMain}>
          <div className={styles.menuSection}>
            <h4 className={styles.sectionTitle}>NFL GAMES</h4>
            <div className={styles.gamesList}>
              {nflGames.map((game) => {
                const isCurrentGame = currentGame === game.title;
                return (
                  <a
                    key={game.title}
                    href={game.url}
                    className={`${styles.gameLink} ${isCurrentGame ? styles.gameLinkActive : ''}`}
                  >
                    {game.title.toUpperCase()}
                  </a>
                );
              })}
            </div>
          </div>

          <div className={styles.menuSection}>
            <h4 className={styles.sectionTitle}>NBA GAMES</h4>
            <div className={styles.gamesList}>
              {nbaGames.map((game) => {
                const isCurrentGame = currentGame === game.title;
                return (
                  <a
                    key={game.title}
                    href={game.url}
                    className={`${styles.gameLink} ${isCurrentGame ? styles.gameLinkActive : ''}`}
                  >
                    {game.title.toUpperCase()}
                  </a>
                );
              })}
            </div>
          </div>

          <div className={styles.menuSection}>
            <h4 className={styles.sectionTitle}>NHL GAMES</h4>
            <div className={styles.gamesList}>
              {nhlGames.map((game) => {
                const isCurrentGame = currentGame === game.title;
                return (
                  <a
                    key={game.title}
                    href={game.url}
                    className={`${styles.gameLink} ${isCurrentGame ? styles.gameLinkActive : ''}`}
                  >
                    {game.title.toUpperCase()}
                  </a>
                );
              })}
            </div>
          </div>

          <div className={styles.menuSection}>
            <h4 className={styles.sectionTitle}>OTHER GAMES</h4>
            <div className={styles.gamesList}>
              {otherGames.map((game) => {
                const isCurrentGame = currentGame === game.title;
                return (
                  <a
                    key={game.title}
                    href={game.url}
                    className={`${styles.gameLink} ${isCurrentGame ? styles.gameLinkActive : ''}`}
                  >
                    {game.title.toUpperCase()}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PFSNHeader;