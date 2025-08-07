'use client';

import { useState, useRef } from 'react';
import EmojiPickerReact from 'emoji-picker-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QUICK_EMOJIS = ['👍', '👏', '💡', '🎉', '🎯'];

export default function EmojiPicker({
  onEmojiSelect,
  onClose,
  isOpen,
}: EmojiPickerProps) {
  const [showFullPicker, setShowFullPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setShowFullPicker(false);
    onClose();
  };

  const handleFullEmojiClick = (emojiData: { emoji: string }) => {
    handleEmojiSelect(emojiData.emoji);
  };

  if (showFullPicker) {
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

  return (
    <div
      ref={pickerRef}
      data-emoji-picker
      className='absolute bottom-full mb-2 right-0 p-2 py-1 bg-white border border-zinc-200 rounded-full z-50 backdrop-blur-sm shadow-xs'
    >
      <div className='flex gap-1 items-center'>
        {QUICK_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleEmojiSelect(emoji)}
            className='h-8 w-8 rounded-full transition-all duration-150 ease-out flex items-center justify-center focus:outline-none hover:bg-zinc-100'
          >
            <span className='text-2xl'>{emoji}</span>
          </button>
        ))}
        <button
          onClick={() => setShowFullPicker(true)}
          className='h-8 w-8 rounded-full transition-all duration-150 ease-out flex items-center justify-center focus:outline-none hover:bg-zinc-100 bg-zinc-100'
        >
          <span className='text-xl text-zinc-900'>+</span>
        </button>
      </div>
    </div>
  );
}
