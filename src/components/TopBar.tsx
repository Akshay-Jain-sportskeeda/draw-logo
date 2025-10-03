import React, { useState } from 'react';
import { User, LogIn, LogOut, Edit } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import styles from '../styles/TopBar.module.css';
import EditProfileModal from './EditProfileModal';

interface TopBarProps {
  user: FirebaseUser | null;
  activeTab: 'game' | 'leaderboard' | 'dashboard';
  onTabChange: (tab: 'game' | 'leaderboard' | 'dashboard') => void;
  onShowLogin: () => void;
  onLogout: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  user,
  activeTab,
  onTabChange,
  onShowLogin,
  onLogout
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <>
      <div className={styles.pfsnHeaderWrap}>
        <div className={styles.pfsnHeaderContainer}>
          {/* Single row layout: Game name, tabs, and user profile */}
          <div className={styles.headerLayout}>
            {/* Game Name - desktop only */}
            <div className={styles.pfsnLogoSection}>
              <h1 className={styles.gameTitle}>NFL Octobox</h1>
            </div>

            {/* Tabs - centered on mobile, left-aligned on desktop */}
            <div className={styles.tabsContainer}>
              <div className={styles.tabsWrapper}>
                <button
                  onClick={() => onTabChange('game')}
                  className={`${styles.tabButton} ${
                    activeTab === 'game'
                      ? styles.activeTab
                      : styles.inactiveTab
                  }`}
                >
                  Game
                </button>
                <button
                  onClick={() => {
                    onTabChange('leaderboard');
                    // Scroll to top when switching to leaderboard
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`${styles.tabButton} ${
                    activeTab === 'leaderboard'
                      ? styles.activeTab
                      : styles.inactiveTab
                  }`}
                >
                  Leaderboard
                </button>
                <button
                  onClick={() => {
                    onTabChange('dashboard');
                    // Scroll to top when switching to dashboard
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`${styles.tabButton} ${
                    activeTab === 'dashboard'
                      ? styles.activeTab
                      : styles.inactiveTab
                  }`}
                >
                  Dashboard
                </button>
              </div>
            </div>

            {/* User Profile - show for both logged in and guest users */}
            <div className={styles.userSection}>
              <div className={styles.userDropdown}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={styles.userButton}
                >
                  <div className={styles.userAvatar}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className={styles.userName}>
                    {user ? (user.displayName || user.email?.split('@')[0] || 'User') : 'Guest'}
                  </span>
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className={styles.dropdownMenu}>
                    {user ? (
                      <>
                        <div className={styles.userInfo}>
                          <div className={styles.userDisplayName}>
                            {user.displayName || user.email?.split('@')[0] || 'User'}
                          </div>
                          <div className={styles.userEmail}>
                            {user.email}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowEditProfile(true);
                            setShowUserMenu(false);
                          }}
                          className={styles.dropdownItem}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onLogout();
                            setShowUserMenu(false);
                          }}
                          className={styles.dropdownItem}
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          onShowLogin();
                          setShowUserMenu(false);
                        }}
                        className={styles.dropdownItem}
                      >
                        <LogIn className="w-4 h-4" />
                        Login
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className={styles.dropdownOverlay}
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </>
  );
};

export default TopBar;