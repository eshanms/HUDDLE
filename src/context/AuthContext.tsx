/**
 * HUDDLE Auth Context
 * Google Authentication state management and provider
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../services/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  signIn: () => Promise<FirebaseUser | undefined>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state listener error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const loggedInUser = await signInWithGoogle();
      return loggedInUser;
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed or cancelled popup request, do not show hard error
        console.log('Google Sign-In popup closed or cancelled by user.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.message && (err.message.includes('token-service-api-has-not-been-used') || err.message.includes('securetoken.googleapis.com'))) {
        setAuthError(
          'Google Sign-In Token Service API (securetoken.googleapis.com) is disabled in your Google Cloud / Firebase project settings. You can enable it in the Google Cloud Console or continue planning in Guest Mode with local storage persistence.'
        );
      } else {
        setAuthError(err.message || 'Failed to sign in with Google');
      }
      return undefined;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setAuthError(err.message || 'Failed to sign out');
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        signIn: handleSignIn,
        signOut: handleSignOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
