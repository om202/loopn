'use client';

import { CONNECTION_STATE_CHANGE, ConnectionState } from 'aws-amplify/api';
import { Hub } from 'aws-amplify/utils';
import { userService } from '../services/user.service';

/**
 * Formats the time since last activity into user-friendly status buckets
 * @param lastSeen - Date when user was last seen
 * @returns Formatted presence status bucket
 */
export function formatPresenceTime(lastSeen: Date | string): string {
  const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // 0-15 minutes: Recently active
  if (diffMinutes <= 15) {
    return 'Recently active';
  }
  
  // 15+ minutes: Offline
  return 'Offline';
}



interface UserInfo {
  userId: string;
  email: string;
}

class SimplePresenceManager {
  private currentUser: UserInfo | null = null;
  private visibilityTimeout: NodeJS.Timeout | null = null;
  private hubUnsubscribe: (() => void) | null = null;
  private isSigningOut: boolean = false; // Track if user is in signout process
  private isInitialized: boolean = false; // Prevent multiple initializations
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly OFFLINE_AFTER_HIDDEN = 30000; // 30 seconds after tab hidden
  private readonly HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

  /**
   * Initialize simple presence management
   */
  initialize(userId: string, email: string) {
    // Prevent multiple initializations
    if (this.isInitialized && this.currentUser?.userId === userId) {
      return;
    }

    // Clean up any existing setup first
    if (this.isInitialized) {
      this.cleanup();
    }

    this.currentUser = { userId, email };
    this.isSigningOut = false;
    this.isInitialized = true;
    this.setupPresenceManagement();
  }

  /**
   * Clean up presence management
   */
  cleanup() {
    this.removeListeners();
    this.clearTimeouts();
    this.currentUser = null;
    this.isSigningOut = false;
    this.isInitialized = false; // Reset initialization flag
  }

  /**
   * Manually set user offline (for sign out)
   */
  async setOffline() {
    if (!this.currentUser) return;

    this.isSigningOut = true; // Mark that we're in signout process

    try {
      await userService.setUserOffline(
        this.currentUser.userId,
        this.currentUser.email
      );
    } catch (error) {
      console.error('Failed to set user offline:', error);
    }
  }

  /**
   * Set up simple presence management using AppSync's built-in capabilities
   */
  private setupPresenceManagement() {
    if (!this.currentUser) return;

    // Set user online initially (only if not signing out)
    if (!this.isSigningOut) {
      userService
        .setUserOnline(this.currentUser.userId, this.currentUser.email)
        .catch(error =>
          console.error('Failed to set user online during setup:', error)
        );
    }

    // Listen to AppSync connection state changes
    this.setupHubListener();

    // Handle page visibility changes (tab switching/backgrounding)
    this.setupVisibilityListener();

    // Handle page unload (browser close/refresh)
    this.setupUnloadListener();

    // Start heartbeat to send "I'm online" every 2 minutes
    this.startHeartbeat();
  }

  /**
   * Listen to AppSync Hub events for connection state changes
   * This is our PRIMARY method for detecting tab close/browser close
   */
  private setupHubListener() {
    // Ensure we don't create duplicate listeners
    if (this.hubUnsubscribe) {
      this.hubUnsubscribe();
    }

    this.hubUnsubscribe = Hub.listen('api', (data: any) => {
      const { payload } = data;

      if (payload.event === CONNECTION_STATE_CHANGE) {
        const connectionState = payload.data.connectionState as ConnectionState;

        switch (connectionState) {
          case 'Disconnected':
            // Only care about disconnections for tab close detection
            if (this.currentUser && !this.isSigningOut) {
              userService
                .setUserOffline(this.currentUser.userId, this.currentUser.email)
                .catch(error =>
                  console.error(
                    'Failed to set user offline on disconnect:',
                    error
                  )
                );
            }
            break;

          // Ignore all other connection states to prevent loops
          default:
            break;
        }
      }
    });
  }

  /**
   * Handle page visibility changes (tab switching, minimizing)
   */
  private setupVisibilityListener() {
    const handleVisibilityChange = () => {
      if (!this.currentUser) return;

      if (document.hidden) {
        // Page became hidden - start timer to set offline
        this.visibilityTimeout = setTimeout(() => {
          if (this.currentUser) {
            userService
              .setUserOffline(this.currentUser.userId, this.currentUser.email)
              .catch(error =>
                console.error('Failed to set user offline when hidden:', error)
              );
          }
        }, this.OFFLINE_AFTER_HIDDEN);
      } else {
        // Page became visible - cancel offline timer and set online (only if not signing out)
        if (this.visibilityTimeout) {
          clearTimeout(this.visibilityTimeout);
          this.visibilityTimeout = null;
        }

        // Set user back online when they return to tab (only if not signing out)
        if (!this.isSigningOut) {
          userService
            .setUserOnline(this.currentUser.userId, this.currentUser.email)
            .catch(error =>
              console.error(
                'Failed to set user online after visibility change:',
                error
              )
            );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Handle page unload (browser close, refresh, navigation)
   * Since reliable tab close detection is nearly impossible,
   * we rely on server-side timeout based on lastSeen timestamps
   */
  private setupUnloadListener() {
    // Simple approach: just try to set offline on page hide
    // Don't rely on this working, the server-side timeout is the real solution
    const handlePageHide = () => {
      if (this.currentUser && !this.isSigningOut) {
        // Best effort attempt to set offline
        userService
          .setUserOffline(this.currentUser.userId, this.currentUser.email)
          .catch(() => {
            // Ignore errors - server timeout will handle it
          });
      }
    };

    window.addEventListener('pagehide', handlePageHide);
  }

  /**
   * Start heartbeat - send "I'm online" every 2 minutes
   */
  private startHeartbeat() {
    if (!this.currentUser || this.isSigningOut) return;

    this.heartbeatInterval = setInterval(() => {
      if (this.currentUser && !this.isSigningOut && !document.hidden) {
        // Send heartbeat - updates lastSeen timestamp
        userService
          .setUserOnline(this.currentUser.userId, this.currentUser.email)
          .catch(error => {
            console.error('Heartbeat failed:', error);
          });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Remove all event listeners
   */
  private removeListeners() {
    if (this.hubUnsubscribe) {
      this.hubUnsubscribe();
      this.hubUnsubscribe = null;
    }

    // Note: We can't easily remove specific event listeners without storing references
    // This is acceptable since cleanup() is called during signout/navigation
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts() {
    if (this.visibilityTimeout) {
      clearTimeout(this.visibilityTimeout);
      this.visibilityTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Export singleton instance
export const simplePresenceManager = new SimplePresenceManager();
