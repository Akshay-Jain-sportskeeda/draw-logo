import { useState, useEffect } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { auth } from '../utils/firebase'

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!auth) {
      setAuthState({
        user: null,
        loading: false,
        error: 'Firebase authentication is not configured'
      })
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        user,
        loading: false,
        error: null
      })
    })

    return () => unsubscribe()
  }, [])

  const formatFirebaseError = (error: any): string => {
    const errorCode = error.code
    const errorMessage = error.message

    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.'
      case 'auth/popup-blocked':
        return 'Pop-up was blocked by your browser. Please allow pop-ups for this site.'
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.'
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled. Please try again.'
      default:
        return errorMessage || 'An unexpected error occurred. Please try again.'
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured')
      }
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      const formattedError = formatFirebaseError(error)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: formattedError
      }))
      throw new Error(formattedError)
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured')
      }
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // If displayName is provided, update the user's profile
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        })
      }
    } catch (error: any) {
      const formattedError = formatFirebaseError(error)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: formattedError
      }))
      throw new Error(formattedError)
    }
  }

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured')
      }
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error: any) {
      const formattedError = formatFirebaseError(error)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: formattedError
      }))
      throw new Error(formattedError)
    }
  }

  const logout = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured')
      }
      await signOut(auth)
    } catch (error: any) {
      const formattedError = formatFirebaseError(error)
      setAuthState(prev => ({ 
        ...prev, 
        error: formattedError
      }))
    }
  }

  return {
    ...authState,
    signIn,
    signUp,
    signInWithGoogle,
    logout
  }
}