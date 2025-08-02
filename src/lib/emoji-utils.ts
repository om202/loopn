export const EMOJI_PATTERN = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{3030}\u{303D}\u{3297}\u{3299}]|[\u{1F170}-\u{1F251}]/u;

export const isEmojiOnly = (text: string): boolean => {
  if (!text.trim()) return false;
  const withoutEmojis = text.replace(new RegExp(EMOJI_PATTERN, 'gu'), '').trim();
  return withoutEmojis === '';
};

export const isEmoji = (char: string): boolean => {
  return new RegExp(`^${EMOJI_PATTERN.source}$`, 'u').test(char);
};

export const splitTextWithEmojis = (text: string): string[] => {
  return text.split(new RegExp(`(${EMOJI_PATTERN.source})`, 'gu'));
};

export const countEmojis = (text: string): number => {
  const matches = text.match(new RegExp(EMOJI_PATTERN, 'gu'));
  return matches ? matches.length : 0;
};