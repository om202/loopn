// Export RAG search utilities
export { 
  createProfileText, 
  generateProfileVersion, 
  validateProfileText,
  testProfileTextGeneration 
} from './profile-text-generator';

// Re-export existing utilities for convenience
export { getClient, configureAmplify } from './amplify-config';
export { initializeAmplify } from './amplify-initialization';
export { EMOJI_CATEGORIES, EMOJI_MAP, getRandomEmoji } from './emoji-utils';
export { ImageCache } from './image-cache';
export { compressImage, generateThumbnail } from './image-utils';
export { INTERESTS } from './interests-data';
export { generateMarkdownResume } from './markdown-resume-generator';
export { 
  updateUserPresence, 
  cleanupOfflineUsers, 
  isUserOnline 
} from './presence-utils';
export { mapResumeToProfile } from './resume-mapper';
export { 
  saveSearchHistory, 
  getSearchHistory, 
  clearSearchHistory 
} from './search-history-utils';
export { isValidUrl, sanitizeUrl } from './url-utils';
