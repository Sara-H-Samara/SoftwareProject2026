import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSearchSuggestions, usePopularSearches } from '@/hooks/useSearch';
import type { SearchFilters } from '@/types';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialQuery?: string;
}

export default function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: suggestions = [] } = useSearchSuggestions(query);
  const { data: popularSearches = [] } = usePopularSearches();
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSubmit = (searchQuery: string) => {
    onSearch({ query: searchQuery });
    setIsOpen(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => prev - 1);
    } else if (e.key === 'Enter' && selectedSuggestion >= 0) {
      handleSubmit(suggestions[selectedSuggestion]);
      setSelectedSuggestion(-1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedSuggestion(-1);
    }
  };
  
  const showDropdown = isOpen && (query.length >= 2 || popularSearches.length > 0);
  
  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search artworks, artists..."
          className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-9 py-2.5
                     text-sm text-stone-800 placeholder:text-stone-400
                     focus:outline-none focus:ring-2 focus:ring-gallery-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl 
                                         shadow-lg border border-stone-200 z-50 overflow-hidden">
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-1 text-xs font-medium text-stone-400 uppercase tracking-wider">
                Suggestions
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSubmit(suggestion)}
                  className={`w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50
                             ${selectedSuggestion === index ? 'bg-stone-50' : ''}`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {popularSearches.length > 0 && (
            <div className="py-2 border-t border-stone-100">
              <p className="px-4 py-1 text-xs font-medium text-stone-400 uppercase tracking-wider">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2 px-4 py-2">
                {popularSearches.slice(0, 5).map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSubmit(term)}
                    className="px-3 py-1 text-xs bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}