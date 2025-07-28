'use client';

import EmojiPicker from 'emoji-picker-react';
import { Send, Smile } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function MessageInput({
  newMessage,
  setNewMessage,
  onSendMessage,
  disabled = false,
  autoFocus = true,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when component is ready
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setNewMessage(newMessage + emojiData.emoji);
    setShowEmojiPicker(false);
    // Re-focus input after emoji selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSend = () => {
    if (disabled) {
      return;
    }
    // Always call onSendMessage - let the parent handle empty message logic
    onSendMessage();
    
    // Auto-focus input after sending message for continuous typing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <>
      {/* Emoji Picker - Separate container */}
      {showEmojiPicker ? (
        <div className='flex-shrink-0 bg-white border-t border-gray-200 p-4'>
          <div className='max-w-4xl mx-auto flex justify-end'>
            <div ref={emojiPickerRef}>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                autoFocusSearch={false}
                width={350}
                height={400}
                previewConfig={{
                  showPreview: false,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Message Input */}
      <div className='flex-shrink-0 bg-white border-t border-gray-200 p-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex gap-3 items-end'>
            <div className='flex-1 relative'>
              <input
                ref={inputRef}
                type='text'
                placeholder='Type your message...'
                value={newMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewMessage(e.target.value)
                }
                onKeyPress={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={disabled}
                className='w-full px-4 py-3 pr-14 border border-gray-200 rounded-full focus:outline-none text-sm bg-gray-100 disabled:opacity-50'
              />
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className='absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200 disabled:opacity-50'
              >
                <Smile className='w-7 h-7' />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={disabled}
              className='flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <Send className='w-5 h-5 rotate-45 -translate-x-0.5' />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
