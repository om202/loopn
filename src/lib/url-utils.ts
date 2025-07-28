/**
 * URL utility functions for shortening chat URLs
 * Frontend-only solution using localStorage to maintain UUID mappings
 */

const CHAT_ID_MAPPING_KEY = 'chat_id_mapping';

/**
 * Get stored UUID mappings from localStorage
 */
function getChatIdMappings(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(CHAT_ID_MAPPING_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Store UUID mapping in localStorage
 */
function storeChatIdMapping(shortId: string, fullUuid: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const mappings = getChatIdMappings();
    mappings[shortId] = fullUuid;
    localStorage.setItem(CHAT_ID_MAPPING_KEY, JSON.stringify(mappings));
  } catch {
    // Silent fail - not critical functionality
  }
}

/**
 * Generates a short, readable ID from UUID
 * Example: "6d3b1cf9-a279-46d0-a446-fd338ae11351" -> "md7k9p2q"
 */
export function shortenChatId(uuid: string): string {
  // Check if we already have a mapping for this UUID
  const mappings = getChatIdMappings();
  const existingShortId = Object.keys(mappings).find(
    key => mappings[key] === uuid
  );

  if (existingShortId) {
    return existingShortId;
  }

  // Generate new short ID using first and last parts of UUID
  const cleanUuid = uuid.replace(/-/g, '');
  const firstPart = cleanUuid.slice(0, 4);
  const lastPart = cleanUuid.slice(-4);

  // Convert to base36 for readability (no confusing characters)
  const decimal = parseInt(firstPart + lastPart, 16);
  const shortId = decimal.toString(36).slice(0, 8).padStart(8, '0');

  // Store the mapping
  storeChatIdMapping(shortId, uuid);

  return shortId;
}

/**
 * Expands a short ID back to the full UUID using stored mapping
 */
export function expandChatId(shortId: string): string | null {
  const mappings = getChatIdMappings();
  return mappings[shortId] || null;
}

/**
 * Creates a short chat URL
 * Example: "6d3b1cf9-a279-46d0-a446-fd338ae11351" -> "/c/md7k9p2q"
 */
export function createShortChatUrl(conversationId: string): string {
  const shortId = shortenChatId(conversationId);
  return `/c/${shortId}`;
}

/**
 * Validates if a string looks like a short chat ID
 */
export function isShortChatId(id: string): boolean {
  return /^[a-z0-9]{8}$/.test(id);
}

/**
 * Get the full conversation ID from URL (handles both short and full formats)
 */
export function getConversationIdFromParam(param: string): string | null {
  // If it's already a full UUID, return as-is
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      param
    )
  ) {
    return param;
  }

  // If it's a short ID, try to expand it
  if (isShortChatId(param)) {
    return expandChatId(param);
  }

  return null;
}
