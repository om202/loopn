'use client';

import { useRef } from 'react';
import EmojiPickerReact from 'emoji-picker-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function EmojiPicker({
  onEmojiSelect,
  onClose,
  isOpen,
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleFullEmojiClick = (emojiData: { emoji: string }) => {
    onEmojiSelect(emojiData.emoji);
    onClose();
  };

  return (
    <div className='absolute bottom-full mb-3 right-0 z-50' data-emoji-picker>
      <div className='rounded-xl overflow-hidden shadow-lg'>
        <EmojiPickerReact
          onEmojiClick={handleFullEmojiClick}
          autoFocusSearch={false}
          width={280}
          height={350}
          previewConfig={{ showPreview: false }}
        />
      </div>
    </div>
  );
}
