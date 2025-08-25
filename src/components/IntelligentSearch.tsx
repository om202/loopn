'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Clock,
  User,
  Briefcase,
  MapPin,
  UserRoundSearch,
} from 'lucide-react';
import {
  VespaService,
  type SearchResult,
  type SearchFilters,
  type RankingProfile,
} from '../services/vespa.service';
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  type SearchHistoryItem,
} from '../lib/search-history-utils';

interface IntelligentSearchProps {
  onUserSelect?: (user: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  rankingProfile?: RankingProfile; // New: allow customizing search ranking
}

export default function IntelligentSearch({
  onUserSelect,
  placeholder = "Search for anyone... (e.g., 'software engineer', 'co-founder', 'marketing expert')",
  showFilters = false,
  rankingProfile = 'default',
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await VespaService.searchUsers(
        searchQuery,
        10,
        filters,
        rankingProfile
      );

      if (response.success && response.results) {
        setResults(response.results);
        setShowResults(true);
        setShowHistory(false);
      } else {
        console.error('Search failed:', response.error);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle query change with debouncing
  const handleQueryChange = (value: string) => {
    setQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Show history if empty, results if has content
    if (!value.trim()) {
      setShowHistory(true);
      setShowResults(false);
      setResults([]);
    } else {
      setShowHistory(false);

      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    }
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!query.trim()) return;

    // Add to search history
    addToSearchHistory(query.trim());
    setSearchHistory(getSearchHistory());

    // Perform immediate search
    await performSearch(query);
  };

  // Handle history item click
  const handleHistoryClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setShowHistory(false);
    performSearch(item.query);
  };

  // Handle history item removal
  const handleRemoveHistory = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeFromSearchHistory(id);
    setSearchHistory(getSearchHistory());
  };

  // Handle user selection
  const handleUserSelect = (user: SearchResult) => {
    setShowResults(false);
    onUserSelect?.(user);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query.trim()) {
      performSearch(query);
    }
  };

  // Clear everything
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setShowHistory(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  return (
    <div
      className={`relative w-full mx-auto transition-all duration-300 ease-out ${isFocused ? 'max-w-4xl' : 'max-w-xl'}`}
    >
      {/* Search Input */}
      <div className='relative'>
        <div className='relative'>
          <div className='absolute left-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm'>
            <UserRoundSearch className='text-brand-600 w-5 h-5' />
          </div>
          <input
            ref={inputRef}
            type='text'
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (!query.trim()) {
                setShowHistory(true);
              } else {
                setShowResults(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={placeholder}
            className={`w-full pl-10 py-4 text-lg border border-slate-200 rounded-xl focus:border-brand-300 focus:outline-none shadow-sm transition-colors ${isFocused ? 'bg-white' : 'bg-slate-50'} ${query ? 'pr-16' : 'pr-4'}`}
          />
          {query && (
            <button
              onClick={handleClear}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-500'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Filters Toggle */}
        {showFilters && (
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className='mt-2 text-sm text-brand-600 hover:text-brand-700'
          >
            {showFiltersPanel ? 'Hide Filters' : 'Show Filters'}
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className='mt-4 p-4 bg-slate-50 rounded-lg border'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-slate-500 mb-1'>
                Industry
              </label>
              <select
                value={filters.industry || ''}
                onChange={e =>
                  handleFilterChange({
                    ...filters,
                    industry: e.target.value || undefined,
                  })
                }
                className='w-full p-2 border border-slate-300 rounded'
              >
                <option value=''>Any Industry</option>
                <option value='technology'>Technology</option>
                <option value='finance'>Finance</option>
                <option value='healthcare'>Healthcare</option>
                <option value='education'>Education</option>
                <option value='marketing'>Marketing</option>
                <option value='design'>Design</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-500 mb-1'>
                Min Experience
              </label>
              <select
                value={filters.minExperience || ''}
                onChange={e =>
                  handleFilterChange({
                    ...filters,
                    minExperience: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className='w-full p-2 border border-slate-300 rounded'
              >
                <option value=''>Any</option>
                <option value='0'>Entry Level</option>
                <option value='2'>2+ Years</option>
                <option value='5'>5+ Years</option>
                <option value='10'>10+ Years</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-500 mb-1'>
                Max Experience
              </label>
              <select
                value={filters.maxExperience || ''}
                onChange={e =>
                  handleFilterChange({
                    ...filters,
                    maxExperience: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className='w-full p-2 border border-slate-300 rounded'
              >
                <option value=''>Any</option>
                <option value='2'>Up to 2 Years</option>
                <option value='5'>Up to 5 Years</option>
                <option value='10'>Up to 10 Years</option>
                <option value='15'>Up to 15 Years</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown */}
      {(showHistory || showResults) && (
        <div
          ref={dropdownRef}
          className='absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto'
        >
          {/* Search History */}
          {showHistory && searchHistory.length > 0 && (
            <div className='p-4'>
              <h3 className='text-sm font-medium text-slate-500 mb-3 flex items-center'>
                <Clock className='w-4 h-4 mr-2' />
                Recent Searches
              </h3>
              <div className='space-y-2'>
                {searchHistory.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className='flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer group'
                    onClick={() => handleHistoryClick(item)}
                  >
                    <span className='text-slate-500'>{item.query}</span>
                    <button
                      onClick={e => handleRemoveHistory(item.id, e)}
                      className='opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-500'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <div className='p-4'>
              {isSearching ? (
                <div className='text-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto'></div>
                  <p className='text-slate-500 mt-2'>Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className='space-y-3'>
                  <h3 className='text-sm font-medium text-slate-500 mb-3'>
                    Found {results.length} people
                  </h3>
                  {results.map(user => (
                    <div
                      key={user.userId}
                      className='p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-slate-200'
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className='flex items-start space-x-3'>
                        <div className='flex-shrink-0'>
                          {user.profile.profilePictureUrl ? (
                            <Image
                              src={user.profile.profilePictureUrl}
                              alt={user.profile.fullName || 'Profile picture'}
                              width={48}
                              height={48}
                              className='w-12 h-12 rounded-full object-cover'
                            />
                          ) : (
                            <div className='w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center'>
                              <User className='w-6 h-6 text-brand-600' />
                            </div>
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h4 className='text-sm font-medium text-slate-950 truncate'>
                            {user.profile.fullName || 'Unknown User'}
                          </h4>
                          <div className='flex items-center text-sm text-slate-500 mt-1'>
                            <Briefcase className='w-4 h-4 mr-1' />
                            <span className='truncate'>
                              {user.profile.jobRole || 'No role specified'}
                            </span>
                          </div>
                          {user.profile.companyName && (
                            <div className='flex items-center text-sm text-slate-500 mt-1'>
                              <MapPin className='w-4 h-4 mr-1' />
                              <span className='truncate'>
                                {user.profile.companyName}
                              </span>
                            </div>
                          )}
                          {user.profile.skills &&
                            user.profile.skills.length > 0 && (
                              <div className='flex flex-wrap gap-1 mt-2'>
                                {user.profile.skills
                                  .slice(0, 3)
                                  .map((skill, index) => (
                                    <span
                                      key={index}
                                      className='inline-block px-2 py-1 text-sm bg-brand-100 text-brand-700 rounded'
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                {user.profile.skills.length > 3 && (
                                  <span className='text-sm text-slate-500'>
                                    +{user.profile.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          <div className='text-sm text-slate-500 mt-1'>
                            Match: {Math.round(user.score * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className='text-center py-8'>
                  <User className='w-12 h-12 text-slate-500 mx-auto mb-3' />
                  <p className='text-slate-500'>No users found for "{query}"</p>
                  <p className='text-sm text-slate-500 mt-1'>
                    Try a different search term or check your filters
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
