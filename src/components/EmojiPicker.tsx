'use client';

import { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const COMMON_EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '😮',
  '😢',
  '😡',
  '🎉',
  '🔥',
  '💯',
  '👏',
  '🙌',
  '👌',
];

export default function EmojiPicker({
  onEmojiSelect,
  onClose,
  isOpen,
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className='absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-xl p-3 z-50 w-[300px] backdrop-blur-sm'
    >
      <div className='grid grid-cols-6 gap-1'>
        {COMMON_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className='h-9 w-9 hover:bg-gray-100 rounded-full transition-all duration-150 ease-out flex items-center justify-center focus:outline-none'
          >
            <span className='text-2xl'>{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
