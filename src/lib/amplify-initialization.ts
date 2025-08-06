import { Amplify } from 'aws-amplify';

class AmplifyInitializationService {
  private static instance: AmplifyInitializationService;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): AmplifyInitializationService {
    if (!AmplifyInitializationService.instance) {
      AmplifyInitializationService.instance =
        new AmplifyInitializationService();
    }
    return AmplifyInitializationService.instance;
  }

  /**
   * Initialize Amplify and ensure it's ready for use
   * This is safe to call multiple times - it will only initialize once
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      // Small delay to ensure configuration is fully processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify Amplify is actually configured
      const config = Amplify.getConfig();
      if (!config) {
        throw new Error('Amplify configuration not found');
      }

      this.isInitialized = true;
      console.log('Amplify initialization completed successfully');
    } catch (error) {
      console.error('Error during Amplify initialization:', error);
      // Still mark as initialized to prevent blocking the app
      this.isInitialized = true;
      throw error;
    }
  }

  /**
   * Check if Amplify is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Wait for Amplify to be ready
   */
  async waitForReady(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    return this.initialize();
  }
}

// Export singleton instance
export const amplifyInitialization = AmplifyInitializationService.getInstance();
