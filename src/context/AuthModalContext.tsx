'use client';

import React, { createContext, useContext, useState } from 'react';

interface AuthModalContextType {
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <AuthModalContext.Provider value={{ showLoginModal, setShowLoginModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}