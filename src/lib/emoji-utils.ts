export const EMOJI_PATTERN =
  /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{3030}\u{303D}\u{3297}\u{3299}]|[\u{1F170}-\u{1F251}]/u;

// Text-based emoticon to emoji mapping
export const EMOTICON_TO_EMOJI: Record<string, string> = {
  // Happy faces
  ':)': '😊',
  ':-)': '😊',
  '=)': '😊',
  '(:': '😊',
  ':D': '😃',
  ':-D': '😃',
  '=D': '😃',
  XD: '😆',
  xD: '😆',
  ':P': '😛',
  ':-P': '😛',
  ':p': '😛',
  ':-p': '😛',
  ';)': '😉',
  ';-)': '😉',
  ';P': '😜',
  ';p': '😜',

  // Sad faces
  ':(': '😞',
  ':-(': '😞',
  '=(': '😞',
  ":'(": '😢',
  ':,(': '😢',

  // Love/heart
  '<3': '❤️',
  '</3': '💔',

  // Other expressions
  ':|': '😐',
  ':-|': '😐',
  ':/': '😕',
  ':-/': '😕',
  ':\\': '😕',
  ':-\\': '😕',
  ':o': '😮',
  ':-o': '😮',
  ':O': '😮',
  ':-O': '😮',
  '>:(': '😠',
  '>:-(': '😠',
  ':*': '😘',
  ':-*': '😘',

  // Misc
  '8)': '😎',
  '8-)': '😎',
  'B)': '😎',
  'B-)': '😎',
  ':S': '😖',
  ':-S': '😖',
  ':s': '😖',
  ':-s': '😖',
  '^^': '😊',
  '^_^': '😊',
  '-_-': '😑',
  '>_<': '😣',
  o_O: '😳',
  O_o: '😳',
  o_o: '😳',
  O_O: '😳',
};

// Function to convert emoticons to emojis
export const convertEmoticonsToEmojis = (text: string): string => {
  let convertedText = text;

  // Sort emoticons by length (descending) to handle longer ones first
  // This prevents conflicts like ":)" being matched before ":-)"
  const sortedEmoticons = Object.keys(EMOTICON_TO_EMOJI).sort(
    (a, b) => b.length - a.length
  );

  for (const emoticon of sortedEmoticons) {
    const emoji = EMOTICON_TO_EMOJI[emoticon];
    // Much simpler approach: just replace the emoticon wherever it appears
    // We'll use split and join to be more reliable
    const parts = convertedText.split(emoticon);
    if (parts.length > 1) {
      convertedText = parts.join(emoji);
    }
  }

  return convertedText;
};

export const isEmojiOnly = (text: string): boolean => {
  if (!text.trim()) return false;
  // First convert emoticons to emojis, then check if only emojis remain
  const convertedText = convertEmoticonsToEmojis(text);
  const withoutEmojis = convertedText
    .replace(new RegExp(EMOJI_PATTERN, 'gu'), '')
    .trim();
  return withoutEmojis === '';
};

export const isEmoji = (char: string): boolean => {
  return new RegExp(`^${EMOJI_PATTERN.source}$`, 'u').test(char);
};

export const splitTextWithEmojis = (text: string): string[] => {
  // First convert emoticons to emojis, then split
  const convertedText = convertEmoticonsToEmojis(text);
  return convertedText.split(new RegExp(`(${EMOJI_PATTERN.source})`, 'gu'));
};

export const countEmojis = (text: string): number => {
  // First convert emoticons to emojis, then count
  const convertedText = convertEmoticonsToEmojis(text);
  const matches = convertedText.match(new RegExp(EMOJI_PATTERN, 'gu'));
  return matches ? matches.length : 0;
};
