'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, Clock } from 'lucide-react';
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  type SearchHistoryItem,
} from '../lib/search-history-utils';

interface SearchUserProps {
  onProfessionalRequest?: (request: string) => void;
}

export default function SearchUser({ onProfessionalRequest }: SearchUserProps) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load search history on component mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isProcessing) {
      setIsProcessing(true);
      // Add to search history
      addToSearchHistory(query.trim());
      setSearchHistory(getSearchHistory());
      // Hide dropdown
      setShowHistory(false);

      onProfessionalRequest?.(query);
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  };

  const handleInputFocus = () => {
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleHistoryItemClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    // Trigger search immediately
    if (!isProcessing) {
      setIsProcessing(true);
      // Move to top of history
      addToSearchHistory(historyQuery);
      setSearchHistory(getSearchHistory());

      onProfessionalRequest?.(historyQuery);
      setTimeout(() => setIsProcessing(false), 1000);
    }
  };

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFromSearchHistory(id);
    setSearchHistory(getSearchHistory());

    // If no more history items, hide dropdown
    const updatedHistory = getSearchHistory();
    if (updatedHistory.length === 0) {
      setShowHistory(false);
    }
  };

  const handleClearInput = () => {
    setQuery('');
    setShowHistory(false);
    inputRef.current?.focus();
  };

  return (
    <div className='max-w-md mx-auto relative'>
      <form
        onSubmit={handleSubmit}
        className='relative'
        autoComplete='off'
        data-form-type='other'
        data-lpignore='true'
        data-1p-ignore
        data-bwignore
        role='search'
        aria-label='Professional search form'
      >
        <input
          autoComplete='off'
          name='username-fake'
          type='text'
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-hidden='true'
        />
        <input
          autoComplete='off'
          name='password-fake'
          type='password'
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-hidden='true'
        />
        <Sparkles className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500 z-10' />
        <input
          ref={inputRef}
          type='text'
          placeholder='Search for professionals, skills, companies...'
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={isProcessing}
          autoComplete='off'
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
          name='professional-lookup-field'
          id='professional-lookup-input'
          role='textbox'
          aria-label='Search for professionals'
          style={{
            fontSize: '16px',
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
          className='w-full pl-10 pr-16 py-3 rounded-full focus:outline-none focus:ring-1 focus:ring-brand-200 focus:bg-white bg-zinc-100 hover:bg-brand-50 transition-colors placeholder-zinc-500'
        />

        {/* Clear button - only show when there's text */}
        {query.trim() && (
          <button
            type='button'
            onClick={handleClearInput}
            className='absolute right-11 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition-colors'
            aria-label='Clear search'
          >
            <X className='w-4 h-4' />
          </button>
        )}

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

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div
          ref={dropdownRef}
          className='absolute top-full left-0 right-0 bg-white border border-zinc-200 rounded-2xl shadow-lg z-20 max-h-64 overflow-y-auto mt-2'
        >
          <div className='py-2'>
            <div className='px-4 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-100'>
              Recent searches
            </div>
            {searchHistory.map(item => (
              <div
                key={item.id}
                className='flex items-center justify-between px-4 py-3 hover:bg-zinc-50 cursor-pointer group'
                onClick={() => handleHistoryItemClick(item.query)}
              >
                <div className='flex items-center gap-3 flex-1 min-w-0'>
                  <Clock className='w-4 h-4 text-zinc-400 flex-shrink-0' />
                  <span className='text-sm text-zinc-700 truncate'>
                    {item.query}
                  </span>
                </div>
                <button
                  type='button'
                  onClick={e => handleDeleteHistoryItem(e, item.id)}
                  className='flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity'
                  aria-label={`Remove "${item.query}" from search history`}
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
