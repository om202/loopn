'use client';

import EmojiPicker from 'emoji-picker-react';
import { Smile, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Schema } from '../../../amplify/data/resource';
import { convertEmoticonsToEmojis } from '../../lib/emoji-utils';

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

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

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
  };

  const handleSend = () => {
    if (disabled) {
      return;
    }

    onSendMessage();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const getRepliedToContent = (content: string) => {
    const convertedContent = convertEmoticonsToEmojis(content);
    const maxLength = 60;
    return convertedContent.length > maxLength
      ? convertedContent.substring(0, maxLength) + '...'
      : convertedContent;
  };

  return (
    <>
      {replyToMessage && (
        <div className='bg-slate-50 border-t border-slate-200 px-4 sm:px-6 lg:px-20 xl:px-32 py-3'>
          <div className='relative pr-8'>
            <div className='flex items-center text-sm text-slate-600 mb-3'>
              <svg
                className='w-4 h-4 mr-2 text-blue-600'
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
            <div className='text-base text-slate-800 bg-white rounded-lg px-4 py-3 border border-slate-200'>
              {getRepliedToContent(replyToMessage.content)}
            </div>
            {onCancelReply && (
              <button
                onClick={onCancelReply}
                className='absolute top-0 right-0 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200'
                title='Cancel reply'
              >
                <X className='w-4 h-4' />
              </button>
            )}
          </div>
        </div>
      )}

      <div className='flex-shrink-0 bg-white border-t border-slate-200 p-4 sm:p-6 lg:px-20 xl:px-32 shadow-lg relative'>
        <div className='w-full'>
          <form
            autoComplete='off'
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            data-form-type='other'
            data-lpignore='true'
            data-1p-ignore
            data-bwignore
            style={{ position: 'relative' }}
          >
            <input
              autoComplete='false'
              name='hidden'
              type='text'
              style={{ display: 'none' }}
              tabIndex={-1}
              aria-hidden='true'
            />

            {showEmojiPicker && (
              <div className='absolute bottom-full right-0 mb-2 z-50'>
                <div
                  ref={emojiPickerRef}
                  className='rounded-lg overflow-hidden shadow-xl w-[min(350px,calc(100vw-2rem))]'
                >
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
            )}
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
                  autoComplete='new-text'
                  autoCorrect='off'
                  autoCapitalize='off'
                  spellCheck='false'
                  data-lpignore='true'
                  data-1p-ignore
                  data-bwignore
                  data-form-type='other'
                  data-ms-editor='false'
                  data-ms-spell-check='false'
                  data-gramm='false'
                  data-gramm_editor='false'
                  data-enable-grammarly='false'
                  name='chat-input'
                  id='chat-message-input'
                  role='textbox'
                  aria-label='Type your message'
                  style={{
                    fontSize: '16px',
                    WebkitAppearance: 'none',
                    MozAppearance: 'textfield',
                  }}
                  className='w-full px-5 py-3 pr-14 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base font-medium bg-slate-50 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-500'
                />
                <button
                  type='button'
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={disabled}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-all duration-200 p-2 rounded-full hover:bg-slate-100 focus:outline-none disabled:opacity-50 ${
                    showEmojiPicker ? 'text-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <Smile className='w-6 h-6' />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={disabled}
                className='flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              >
                <Image
                  src='/send_icon.svg'
                  alt='Send'
                  width={20}
                  height={20}
                  className='flex-shrink-0 brightness-0 invert translate-x-0.5 opacity-80 hover:opacity-100 transition-opacity duration-200'
                />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
