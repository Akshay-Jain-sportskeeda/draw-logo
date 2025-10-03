import React from 'react';

interface FooterProps {
  currentPage?: 'CBB' | 'CFB' | 'Fantasy' | 'MLB' | 'NASCAR' | 'NBA' | 'NFL' | 'NHL' | 'Tennis' | 'WNBA' | 'WWE';
}

const PFSNFooter: React.FC<FooterProps> = ({ currentPage }) => {
  return (
    <footer className="pfsn-footer">
        <div className="pfsn-footer-container">
        <div className="footer-columns">
            <div className="footer-column">
              <h3 className="footer-column-title">NEWS & ANALYSIS</h3>
              <ul className="footer-links">
                <li className={currentPage === 'CBB' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/mens-cbb/" target="_blank" rel="noopener noreferrer">CBB</a></li>
                <li className={currentPage === 'CFB' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/cfb/" target="_blank" rel="noopener noreferrer">CFB</a></li>
                <li className={currentPage === 'Fantasy' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/fantasy-football/" target="_blank" rel="noopener noreferrer">Fantasy</a></li>
                <li className={currentPage === 'MLB' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/mlb/" target="_blank" rel="noopener noreferrer">MLB</a></li>
                <li className={currentPage === 'NASCAR' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nascar/" target="_blank" rel="noopener noreferrer">NASCAR</a></li>
                <li className={currentPage === 'NBA' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nba/" target="_blank" rel="noopener noreferrer">NBA</a></li>
                <li className={currentPage === 'NFL' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nfl/" target="_blank" rel="noopener noreferrer">NFL</a></li>
                <li className={currentPage === 'NHL' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/nhl/" target="_blank" rel="noopener noreferrer">NHL</a></li>
                <li className={currentPage === 'Tennis' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/tennis/" target="_blank" rel="noopener noreferrer">Tennis</a></li>
                <li className={currentPage === 'WNBA' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/wnba/" target="_blank" rel="noopener noreferrer">WNBA</a></li>
                <li className={currentPage === 'WWE' ? 'current-page' : ''}><a href="https://www.profootballnetwork.com/wwe/" target="_blank" rel="noopener noreferrer">WWE</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">NFL TOOLS</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/mockdraft" target="_blank" rel="noopener noreferrer">NFL Mock Draft Simulator</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-playoff-predictor" target="_blank" rel="noopener noreferrer">NFL Season & Playoff Predictor</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-offseason-salary-cap-free-agency-manager" target="_blank" rel="noopener noreferrer">NFL Offseason Manager</a></li>
                <li><a href="https://www.profootballnetwork.com/cta-big-board-builder-nfl-draft/" target="_blank" rel="noopener noreferrer">NFL Draft Big Board Builder</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-power-rankings-builder" target="_blank" rel="noopener noreferrer">NFL Power Rankings Builder</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-player-rankings" target="_blank" rel="noopener noreferrer">NFL Player Rankings</a></li>
              </ul>

              <h3 className="footer-column-title footer-subheading">OTHER TOOLS</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/cfb-playoff-predictor" target="_blank" rel="noopener noreferrer">CFB Playoff Predictor</a></li>
                <li><a href="https://www.profootballnetwork.com/mlb-playoff-predictor" target="_blank" rel="noopener noreferrer">MLB Playoff Predictor</a></li>
                <li><a href="https://www.profootballnetwork.com/nba-mock-draft" target="_blank" rel="noopener noreferrer">NBA Mock Draft Simulator</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">FANTASY FOOTBALL TOOLS</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/fantasy-football-mock-draft-simulator/" target="_blank" rel="noopener noreferrer">Fantasy Mock Draft Simulator</a></li>
                <li><a href="https://www.profootballnetwork.com/who-should-i-start-fantasy-optimizer" target="_blank" rel="noopener noreferrer">Fantasy Start/Sit Optimizer</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-waiver-wire" target="_blank" rel="noopener noreferrer">Fantasy Waiver Wire Assistant</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-trade-analyzer" target="_blank" rel="noopener noreferrer">Fantasy Trade Analyzer</a></li>
                <li><a href="https://www.profootballnetwork.com/dynasty-fantasy-football-trade-value-charts" target="_blank" rel="noopener noreferrer">Dynasty Trade Charts</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-trade-value-charts" target="_blank" rel="noopener noreferrer">Redraft Trade Charts</a></li>
                <li><a href="https://www.profootballnetwork.com/nfl-dfs-optimizer-lineup-generator" target="_blank" rel="noopener noreferrer">NFL DFS Optimizer</a></li>
                <li><a href="https://www.profootballnetwork.com/who-should-i-draft-fantasy-football" target="_blank" rel="noopener noreferrer">Who Should I Draft?</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-team-name-generator" target="_blank" rel="noopener noreferrer">Team Name Generator</a></li>
                <li><a href="https://www.profootballnetwork.com/fantasy-football-draft-order-generator-randomizer/" target="_blank" rel="noopener noreferrer">Draft Order Randomizer</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h3 className="footer-column-title">BETTING TOOLS</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/betting-odds-calculator-cta/" target="_blank" rel="noopener noreferrer">Odds Calculator</a></li>
                <li><a href="https://www.profootballnetwork.com/parlay-calculator-cta/" target="_blank" rel="noopener noreferrer">Parlay Calculator</a></li>
              </ul>

              <h3 className="footer-column-title footer-subheading">COMPANY</h3>
              <ul className="footer-links">
                <li><a href="https://www.profootballnetwork.com/about-us/" target="_blank" rel="noopener noreferrer">About PFSN</a></li>
                <li><a href="https://www.profootballnetwork.com/contact-media-inquiries-pro-football-network/" target="_blank" rel="noopener noreferrer">Contact Us</a></li>
                <li><a href="https://www.profootballnetwork.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="social-icons">
              <a href="https://facebook.com/PFSN365" aria-label="Facebook" rel="noopener noreferrer" target="_blank">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="mailto:contact@profootballnetwork.com" aria-label="Email">
                <i className="fas fa-envelope"></i>
              </a>
              <a href="/rss" aria-label="RSS Feed">
                <i className="fas fa-rss"></i>
              </a>
              <a href="https://x.com/PFSN365" aria-label="Twitter" rel="noopener noreferrer" target="_blank">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
            <div className="copyright">
              <p>Copyright © 2019-2025. PFSN.</p>
              <p>All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </footer>
  );
};

export default PFSNFooter;