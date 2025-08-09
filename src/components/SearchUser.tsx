'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchUserProps {
  onProfessionalRequest?: (request: string) => void;
}

export default function SearchUser({ onProfessionalRequest }: SearchUserProps) {
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

  return (
    <div className='w-[70%] mx-auto'>
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
        <input
          type='text'
          placeholder='What kind of professional you want to meet?'
          value={query}
          onChange={e => setQuery(e.target.value)}
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
          className='w-full pl-4 pr-12 py-3 border border-zinc-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 bg-zinc-100 hover:bg-white transition-colors placeholder-zinc-500'
        />
        <button
          type='submit'
          disabled={!query.trim() || isProcessing}
          className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 text-white rounded-full hover:bg-brand-600 disabled:opacity-50 flex items-center justify-center'
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
