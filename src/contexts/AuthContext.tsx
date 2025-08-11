'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  signIn,
  signUp,
  confirmSignUp,
  signOut,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  AuthUser,
} from 'aws-amplify/auth';
import {
  OnboardingService,
  UserOnboardingStatus,
} from '@/services/onboarding.service';
import { UserProfileService } from '@/services/user-profile.service';

// Auth Types
export type AuthStatus = 'configuring' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: AuthUser | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  error: string | null;
  onboardingStatus: UserOnboardingStatus | null;
}

export interface AuthContextType extends AuthState {
  // Sign In
  handleSignIn: (email: string, password: string) => Promise<void>;

  // Sign Up
  handleSignUp: (
    email: string,
    password: string,
    givenName?: string,
    familyName?: string
  ) => Promise<void>;
  handleConfirmSignUp: (
    email: string,
    confirmationCode: string
  ) => Promise<void>;
  handleResendSignUpCode: (email: string) => Promise<void>;

  // Password Reset
  handleResetPassword: (email: string) => Promise<void>;
  handleConfirmResetPassword: (
    email: string,
    confirmationCode: string,
    newPassword: string
  ) => Promise<void>;

  // Sign Out
  handleSignOut: () => Promise<void>;

  // Error handling
  clearError: () => void;

  // Onboarding
  checkOnboardingStatus: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    authStatus: 'configuring',
    isLoading: false,
    error: null,
    onboardingStatus: null,
  });

  // Check current auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, authStatus: 'configuring' }));

      const user = await getCurrentUser();
      if (user) {
        setAuthState(prev => ({
          ...prev,
          user,
          authStatus: 'authenticated',
        }));

        // Check onboarding status after authentication
        await checkOnboardingStatus();

        // Ensure anonymous summary exists for existing users (background task)
        UserProfileService.ensureAnonymousSummaryExists().catch(error => {
          console.warn('Background anonymous summary check failed:', error);
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          authStatus: 'unauthenticated',
          onboardingStatus: null,
        }));
      }
    } catch {
      setAuthState(prev => ({
        ...prev,
        user: null,
        authStatus: 'unauthenticated',
        onboardingStatus: null,
      }));
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const onboardingStatus = await OnboardingService.checkOnboardingStatus();
      setAuthState(prev => ({
        ...prev,
        onboardingStatus,
      }));
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setAuthState(prev => ({
        ...prev,
        onboardingStatus: { isOnboardingComplete: false },
      }));
    }
  };

  const refreshOnboardingStatus = async () => {
    try {
      const onboardingStatus =
        await OnboardingService.refreshOnboardingStatus();
      setAuthState(prev => ({
        ...prev,
        onboardingStatus,
      }));
    } catch (error) {
      console.error('Error refreshing onboarding status:', error);
    }
  };

  // Helper to set loading state
  const setLoading = (loading: boolean) => {
    setAuthState(prev => ({ ...prev, isLoading: loading }));
  };

  // Helper to set error state
  const setError = (error: string | null) => {
    setAuthState(prev => ({ ...prev, error }));
  };

  // Sign In
  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const signInResult = await signIn({
        username: email,
        password,
      });

      if (signInResult.isSignedIn) {
        await checkAuthStatus(); // Refresh auth state and check onboarding

        // Ensure anonymous summary exists for existing users (background task)
        UserProfileService.ensureAnonymousSummaryExists().catch(error => {
          console.warn('Background anonymous summary check failed:', error);
        });
      } else {
        // Handle additional sign-in steps if needed
        setError('Sign-in requires additional steps');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up
  const handleSignUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const signUpResult = await signUp({
        username: email,
        password,
      });

      console.log('Sign up result:', signUpResult);
      // User will need to confirm their email
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Sign Up
  const handleConfirmSignUp = async (
    email: string,
    confirmationCode: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      await confirmSignUp({
        username: email,
        confirmationCode,
      });

      // After confirmation, user can sign in
      setError(null);
    } catch (err) {
      console.error('Confirm sign up error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to confirm sign up'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend Sign Up Code
  const handleResendSignUpCode = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      await resendSignUpCode({
        username: email,
      });

      console.log('Verification code resent');
    } catch (err) {
      console.error('Resend code error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      await resetPassword({
        username: email,
      });

      console.log('Password reset code sent');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Confirm Reset Password
  const handleConfirmResetPassword = async (
    email: string,
    confirmationCode: string,
    newPassword: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      await confirmResetPassword({
        username: email,
        confirmationCode,
        newPassword,
      });

      console.log('Password reset successful');
    } catch (err) {
      console.error('Confirm reset password error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to confirm password reset'
      );
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);

      await signOut();
      setAuthState(prev => ({
        ...prev,
        user: null,
        authStatus: 'unauthenticated',
        onboardingStatus: null,
      }));
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  // Clear Error
  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    ...authState,
    handleSignIn,
    handleSignUp,
    handleConfirmSignUp,
    handleResendSignUpCode,
    handleResetPassword,
    handleConfirmResetPassword,
    handleSignOut,
    clearError,
    checkOnboardingStatus,
    refreshOnboardingStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
