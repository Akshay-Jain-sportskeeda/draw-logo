'use client';

'use client';

import React, { useState } from 'react';
import styles from './sidebar.module.css';

interface Game {
  title: string;
  url: string;
  isActive?: boolean;
}

interface GamesPageSidebarProps {
  currentGame?: string;
  isMobile?: boolean;
}

const GamesPageSidebar: React.FC<GamesPageSidebarProps> = ({ currentGame, isMobile = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const nflTools = [
    { title: 'Mock Draft Simulator', url: 'https://www.profootballnetwork.com/mockdraft' },
    { title: 'Draft Prospect Rankings', url: 'https://www.profootballnetwork.com/nfl-draft-prospect-rankings' },
    { title: 'Current Draft Order', url: 'https://www.profootballnetwork.com/current-nfl-draft-order' },
    { title: 'Big Board Builder', url: 'https://www.profootballnetwork.com/nfl-draft-big-board-builder' },
    { title: 'Playoff Predictor', url: 'https://www.profootballnetwork.com/nfl-playoff-predictor' },
    { title: 'Power Rankings Builder', url: 'https://www.profootballnetwork.com/nfl-power-rankings-builder/' },
    { title: 'Player Rankings Tool', url: 'https://www.profootballnetwork.com/nfl-player-rankings-tool' },
    { title: 'Offseason Manager', url: 'https://www.profootballnetwork.com/nfl-offseason-salary-cap-free-agency-manager' },
    { title: 'Salary Cap Space', url: 'https://www.profootballnetwork.com/nfl-salary-cap-space-by-team' },
  ];

  const fantasyTools = [
    { title: 'Trade Analyzer', url: 'https://www.profootballnetwork.com/fantasy-football-trade-analyzer' },
    { title: 'Start/Sit Optimizer', url: 'https://www.profootballnetwork.com/who-should-i-start-fantasy-optimizer' },
    { title: 'Waiver Wire Assistant', url: 'https://www.profootballnetwork.com/fantasy-football-waiver-wire' },
    { title: 'Trade Value Charts', url: 'https://www.profootballnetwork.com/fantasy-football-trade-value-charts' },
    { title: 'DFS Lineup Optimizer', url: 'https://www.profootballnetwork.com/nfl-dfs-optimizer-lineup-generator' },
  ];

  const otherTools = [
    { title: 'CFB Playoff Predictor', url: 'https://www.profootballnetwork.com/college-football-playoff-predictor' },
    { title: 'MLB Playoff Predictor', url: 'https://www.profootballnetwork.com/mlb-playoff-predictor/' },
    { title: 'NBA Mock Draft', url: 'https://www.profootballnetwork.com/nba-mock-draft-simulator' },
  ];

  const nflGames = [
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

  // Combine all games for mobile view
  const allGames = [...nflGames, ...nbaGames, ...nhlGames, ...otherGames];

  // Mobile version
  if (isMobile) {
    return (
      <div className={styles.mobileSidebar}>
        <div className={styles.mobileHeader}>
          <div className={styles.mobileTitle}>
            <span className={styles.mobileTitleText}>PFSN Games</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.mobileToggle}
            aria-label="Toggle games menu"
          >
            <svg
              className={`${styles.mobileToggleIcon} ${isExpanded ? styles.expanded : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className={styles.mobileContent}>
            <div className={styles.mobileGrid}>
              {allGames.map((game) => {
                const isCurrentGame = currentGame === game.title;
                return (
                  <a
                    key={game.title}
                    href={game.url}
                    className={`${styles.mobileGameLink} ${isCurrentGame ? styles.mobileGameLinkActive : ''}`}
                  >
                    <div className={styles.mobileGameContent}>
                      <div className={styles.mobileGameTitle}>{game.title}</div>
                      {isCurrentGame && (
                        <div className={styles.mobileGamePlaying}>Playing</div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className={styles.sidebar}>
      {/* Header with logo */}
      <div className={styles.logoSection}>
        <a href="https://www.profootballnetwork.com" target="_blank" rel="noopener noreferrer" className={styles.logoLink}>
          <img
            src="https://statico.profootballnetwork.com/wp-content/uploads/2025/06/12093424/tools-navigation-06-12-25.jpg"
            alt="PFSN Logo"
            className={styles.logo}
          />
        </a>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {/* NFL Games Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>NFL Games</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {nflGames.map((game) => {
            const isCurrentGame = currentGame === game.title;
            return (
              <li key={game.title}>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.navLink} ${isCurrentGame ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.navLinkText}>
                    {game.title}
                    {isCurrentGame && (
                      <span className={styles.currentBadge}>Current</span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}

          {/* NBA Games Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>NBA Games</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {nbaGames.map((game) => {
            const isCurrentGame = currentGame === game.title;
            return (
              <li key={game.title}>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.navLink} ${isCurrentGame ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.navLinkText}>
                    {game.title}
                    {isCurrentGame && (
                      <span className={styles.currentBadge}>Current</span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}

          {/* NHL Games Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>NHL Games</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {nhlGames.map((game) => {
            const isCurrentGame = currentGame === game.title;
            return (
              <li key={game.title}>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.navLink} ${isCurrentGame ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.navLinkText}>
                    {game.title}
                    {isCurrentGame && (
                      <span className={styles.currentBadge}>Current</span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}

          {/* Other Games Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>Other Games</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {otherGames.map((game) => {
            const isCurrentGame = currentGame === game.title;
            return (
              <li key={game.title}>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.navLink} ${isCurrentGame ? styles.navLinkActive : ''}`}
                >
                  <span className={styles.navLinkText}>
                    {game.title}
                    {isCurrentGame && (
                      <span className={styles.currentBadge}>Current</span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}

          {/* NFL Tools Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>NFL Tools</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {nflTools.map((tool) => (
            <li key={tool.title}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navLink}
              >
                <span className={styles.navLinkText}>
                  {tool.title}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.externalIcon}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            </li>
          ))}

          {/* Fantasy Football Tools Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>Fantasy Football Tools</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {fantasyTools.map((tool) => (
            <li key={tool.title}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navLink}
              >
                <span className={styles.navLinkText}>
                  {tool.title}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.externalIcon}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            </li>
          ))}

          {/* Other Tools Section */}
          <li className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <div className={styles.sectionTitleContent}>
                <div className={styles.sectionDot}></div>
                <span className={styles.sectionTitle}>Other Tools</span>
              </div>
              <div className={styles.sectionLine}></div>
            </div>
          </li>
          {otherTools.map((tool) => (
            <li key={tool.title}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.navLink}
              >
                <span className={styles.navLinkText}>
                  {tool.title}
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={styles.externalIcon}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom padding for footer ad */}
      <div className={styles.footerSpace} aria-hidden="true"></div>
    </div>
  );
};

export default GamesPageSidebar;