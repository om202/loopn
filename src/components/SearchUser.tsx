'use client';

import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface SearchUserProps {
  onProfessionalRequest?: (request: string) => void;
  onChatRequestSent?: () => void;
  activeSection?: string;
}

export default function SearchUser({
  onProfessionalRequest,
  onChatRequestSent,
  activeSection,
}: SearchUserProps) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isProcessing) {
      setIsProcessing(true);
      onProfessionalRequest?.(query);
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  };

  return (
    <div className='max-w-md mx-auto'>
      <form
        onSubmit={handleSubmit}
        className='relative'
        autoComplete='off'
        data-form-type='other'
        data-lpignore='true'
        data-1p-ignore
        data-bwignore
      >
        <input
          autoComplete='false'
          name='hidden'
          type='text'
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-hidden='true'
        />
        <Sparkles className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 z-10' />
        <input
          type='text'
          placeholder='Search for professionals, skills, companies...'
          value={query}
          onChange={handleInputChange}
          disabled={isProcessing}
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
          name='professional-request-input'
          id='professional-request-input'
          className='w-full pl-10 pr-10 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-brand-200 focus:bg-white bg-zinc-100 hover:bg-brand-50 transition-colors placeholder-zinc-500'
        />
        <button
          type='submit'
          className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 text-white rounded-full hover:bg-brand-600 flex items-center justify-center'
        >
          {isProcessing ? (
            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
          ) : (
            <Search className='w-4 h-4' />
          )}
        </button>
      </form>
    </div>
  );
}
