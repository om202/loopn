'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Search, X, Clock } from 'lucide-react';
import GradientSparkles from './GradientSparkles';
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  type SearchHistoryItem,
} from '../lib/search-history-utils';

interface SearchUserProps {
  onProfessionalRequest?: (request: string) => void;
  userProfile?: Record<string, unknown>;
}

export default function SearchUser({
  onProfessionalRequest,
  userProfile: _userProfile,
}: SearchUserProps) {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isProcessing) {
      setIsProcessing(true);
      // Add to search history
      addToSearchHistory(query.trim());
      setSearchHistory(getSearchHistory());
      // Hide dropdown
      setShowHistory(false);

      const searchQuery = query.trim();

      // Immediately trigger the search without doing RAG processing here
      // The SearchSectionContent component will handle the actual search
      onProfessionalRequest?.(searchQuery);

      // Quick reset of processing state - no artificial delay
      setTimeout(() => setIsProcessing(false), 200);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
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
      setTimeout(() => setIsProcessing(false), 200);
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
    <div className='w-full sm:max-w-xl sm:mx-auto relative'>
      {/* Mobile Logo + Search Layout */}
      <div className='flex items-center gap-3 sm:block'>
        {/* Logo - only visible on mobile */}
        <div className='flex-shrink-0 sm:hidden'>
          <Image
            src='/loopn.svg'
            alt='Loopn'
            width={38}
            height={38}
            className='w-12 h-12'
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className='relative flex-1 sm:flex-none'
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
          <GradientSparkles className='absolute left-3 top-1/2 -translate-y-1/2 w-5.5 h-5.5 text-brand-500' />
          <input
            ref={inputRef}
            type='text'
            placeholder='Ask Anything or Search'
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
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
            className='w-full pl-10 pr-16 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-200 bg-gray-50 text-gray-900 hover:bg-gray-100 transition-colors placeholder-gray-500'
          />

          {/* Clear button - only show when there's text */}
          {query.trim() && (
            <button
              type='button'
              onClick={handleClearInput}
              className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 text-brand-500 hover:text-brand-700 flex items-center justify-center transition-all duration-300 ${
                isFocused ? 'right-28' : 'right-11'
              }`}
              aria-label='Clear search'
            >
              <X className='w-4 h-4' />
            </button>
          )}

          <button
            type='submit'
            onMouseDown={(e) => e.preventDefault()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full hover:bg-brand-100 flex items-center justify-center transition-all duration-300 ease-out border border-brand-200 overflow-hidden ${
              isFocused ? 'w-24 h-8 px-4' : 'w-8 h-8'
            }`}
          >
            {isProcessing ? (
              <div className='w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin flex-shrink-0' />
            ) : (
              <>
                <Search className='w-4 h-4 text-brand-500 flex-shrink-0' />
                {isFocused && (
                  <span className='text-sm font-medium text-brand-500 whitespace-nowrap transition-all duration-300 ease-out ml-2'>
                    Search
                  </span>
                )}
              </>
            )}
          </button>
        </form>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div
            ref={dropdownRef}
            className='absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 max-h-64 overflow-y-auto mt-2'
          >
            <div className='py-2'>
              <div className='px-4 py-2 text-sm font-medium text-neutral-500 border-b border-gray-100'>
                Recent searches
              </div>
              {searchHistory.map(item => (
                <div
                  key={item.id}
                  className='flex items-center justify-between px-4 py-3 hover:bg-gray-100 cursor-pointer group'
                  onClick={() => handleHistoryItemClick(item.query)}
                >
                  <div className='flex items-center gap-3 flex-1 min-w-0'>
                    <Clock className='w-4 h-4 text-neutral-500 flex-shrink-0' />
                    <span className='text-sm text-neutral-500 truncate'>
                      {item.query}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={e => handleDeleteHistoryItem(e, item.id)}
                    className='flex-shrink-0 p-1 text-neutral-500 hover:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity'
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
    </div>
  );
}
