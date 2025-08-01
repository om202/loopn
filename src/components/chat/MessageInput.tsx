'use client';

import EmojiPicker from 'emoji-picker-react';
import { Send, Smile, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Schema } from '../../../amplify/data/resource';

type Message = Schema['Message']['type'];

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendMessage: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
}

export default function MessageInput({
  newMessage,
  setNewMessage,
  onSendMessage,
  disabled = false,
  autoFocus = true,
  replyToMessage,
  onCancelReply,
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

  const getRepliedToContent = (content: string) => {
    const maxLength = 60;
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <>
      {/* Reply Preview */}
      {replyToMessage && (
        <div className='bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center text-sm text-gray-600 mb-1'>
              <svg 
                className='w-4 h-4 mr-2 text-blue-500' 
                fill='none' 
                stroke='currentColor' 
                viewBox='0 0 24 24'
              >
                <path 
                  strokeLinecap='round' 
                  strokeLinejoin='round' 
                  strokeWidth={2} 
                  d='M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' 
                />
              </svg>
              <span className='font-medium'>Replying to message</span>
            </div>
            <div className='text-sm text-gray-800 bg-white rounded-lg px-3 py-2 border border-gray-200'>
              {getRepliedToContent(replyToMessage.content)}
            </div>
          </div>
          {onCancelReply && (
            <button
              onClick={onCancelReply}
              className='ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors'
              title='Cancel reply'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>
      )}

      {/* Emoji Picker - Material Design container */}
      {showEmojiPicker ? (
        <div className=''>
          <div className='max-w-3xl mx-auto flex justify-end'>
            <div ref={emojiPickerRef} className='rounded-lg overflow-hidden shadow-xl'>
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

      {/* Message Input - Material Design styling */}
      <div className='flex-shrink-0 bg-white border-t border-gray-200 p-4 shadow-lg'>
        <div className='max-w-3xl mx-auto'>
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
                className='w-full px-5 py-3 pr-14 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500'
              />
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-all duration-200 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  showEmojiPicker ? 'text-blue-600 bg-blue-50' : ''
                }`}
              >
                <Smile className='w-6 h-6' />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={disabled}
              className='flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95'
            >
              <Send className='w-4 h-4 ml-0.5 rotate-45' />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
