/**
 * Profile text generation utility for RAG search embeddings
 * Converts any UserProfile data structure into searchable text content
 *
 * Key features:
 * - Zero field logic - works with any profile structure
 * - Handles JSON fields, arrays, and nested objects
 * - Future-proof - new fields automatically included
 * - Clean text output suitable for embedding generation
 */

/**
 * Convert any profile data (regardless of filled fields) into raw searchable text
 * This function is field-agnostic and will process any profile structure
 *
 * @param profile - UserProfile object with any combination of filled fields
 * @returns string - Clean, searchable text representation of the profile
 */
export function createProfileText(profile: any): string {
  const textParts: string[] = [];

  // Skip these metadata fields that aren't useful for search
  const skipFields = [
    'userId',
    'id',
    'createdAt',
    'updatedAt',
    '__typename',
    'profilePictureUrl',
    'profilePictureThumbnailUrl',
    'hasProfilePicture',
    'isOnboardingComplete',
    'onboardingCompletedAt',
    'autoFilledFields',
  ];

  // Process all fields - no field-specific logic needed
  Object.entries(profile).forEach(([key, value]) => {
    // Skip metadata fields
    if (skipFields.includes(key)) {
      return;
    }

    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        // Handle arrays (skills, interests, hobbies, etc.)
        if (value.length > 0) {
          const arrayText = value
            .map(item =>
              typeof item === 'object' ? JSON.stringify(item) : String(item)
            )
            .join(' ');
          if (arrayText.trim()) {
            textParts.push(arrayText);
          }
        }
      } else if (typeof value === 'object') {
        // Handle JSON fields (workExperience, education, projects, etc.)
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;

          if (Array.isArray(parsed)) {
            // JSON array - extract text from all objects
            const flattened = parsed
              .map(item => {
                if (typeof item === 'object' && item !== null) {
                  // Extract all values from nested objects
                  return Object.values(item)
                    .filter(
                      val => val !== null && val !== undefined && val !== ''
                    )
                    .map(val => String(val))
                    .join(' ');
                } else {
                  return String(item);
                }
              })
              .join(' ');

            if (flattened.trim()) {
              textParts.push(flattened);
            }
          } else if (parsed && typeof parsed === 'object') {
            // Single JSON object - extract all values
            const objectText = Object.values(parsed)
              .filter(val => val !== null && val !== undefined && val !== '')
              .map(val => String(val))
              .join(' ');

            if (objectText.trim()) {
              textParts.push(objectText);
            }
          } else {
            // Fallback - stringify the whole thing
            const jsonText = JSON.stringify(parsed)
              .replace(/[{}",[\]]/g, ' ') // Remove JSON syntax
              .replace(/\s+/g, ' ')
              .trim();

            if (jsonText) {
              textParts.push(jsonText);
            }
          }
        } catch (e) {
          console.error('Error ', e);
          // If JSON parsing fails, treat as string
          const stringValue = String(value);
          if (stringValue.trim()) {
            textParts.push(stringValue);
          }
        }
      } else {
        // Handle primitive values (strings, numbers, booleans)
        const stringValue = String(value);
        if (stringValue.trim()) {
          textParts.push(stringValue);
        }
      }
    }
  });

  // Clean up and return the final text
  return textParts
    .join(' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[{}",[\]]/g, ' ') // Remove JSON syntax characters
    .replace(/[^\w\s.-]/g, ' ') // Keep only alphanumeric, spaces, dots, dashes
    .trim();
}

/**
 * Generate a version hash for profile data to track changes
 * Used for cache invalidation - when profile changes, embedding needs updating
 *
 * @param profileData - UserProfile object
 * @returns string - Simple version identifier based on content
 */
export function generateProfileVersion(profileData: any): string {
  // Create a simple hash based on profile content
  const contentString = JSON.stringify(
    profileData,
    Object.keys(profileData).sort()
  );

  // Simple hash function (for cache invalidation, not security)
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `v${Math.abs(hash)}_${Date.now()}`;
}

/**
 * Validate that profile text is suitable for embedding generation
 *
 * @param profileText - Generated profile text
 * @returns object - Validation result with warnings
 */
export function validateProfileText(profileText: string): {
  isValid: boolean;
  warnings: string[];
  wordCount: number;
  charCount: number;
} {
  const warnings: string[] = [];

  const charCount = profileText.length;
  const wordCount = profileText
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Check minimum content requirements
  if (charCount < 50) {
    warnings.push(
      'Profile text is very short - may not generate meaningful embeddings'
    );
  }

  if (wordCount < 10) {
    warnings.push(
      'Profile has very few words - consider encouraging users to fill more fields'
    );
  }

  // Check maximum content (Titan v2 has 8K token limit)
  if (charCount > 8000) {
    warnings.push(
      'Profile text exceeds 8000 characters - will be truncated for embedding'
    );
  }

  // Check for meaningful content
  const uniqueWords = new Set(profileText.toLowerCase().split(/\s+/));
  if (uniqueWords.size < 5) {
    warnings.push(
      'Profile has very few unique words - may not be distinctive for search'
    );
  }

  const isValid =
    warnings.length === 0 ||
    warnings.every(w => !w.includes('very short') && !w.includes('very few'));

  return {
    isValid,
    warnings,
    wordCount,
    charCount,
  };
}

/**
 * Example usage and testing function
 */
export function testProfileTextGeneration(): void {
  const sampleProfile = {
    userId: '123',
    fullName: 'John Doe',
    jobRole: 'Senior Software Engineer',
    companyName: 'Tech Corp',
    skills: ['React', 'Node.js', 'TypeScript'],
    workExperience: JSON.stringify([
      {
        company: 'Startup Inc',
        role: 'Frontend Developer',
        duration: '2 years',
      },
      { company: 'Big Tech', role: 'Full Stack Engineer', duration: '3 years' },
    ]),
    about: 'Passionate developer with expertise in modern web technologies',
  };

  const profileText = createProfileText(sampleProfile);
  const validation = validateProfileText(profileText);
  const version = generateProfileVersion(sampleProfile);

  console.log('Profile Text Generation Test:');
  console.log('Generated text:', profileText);
  console.log('Validation:', validation);
  console.log('Version:', version);
}
