import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { SearchFilters, ArtworkType } from '@/types';

const ARTWORK_TYPES: { value: ArtworkType; label: string }[] = [
  { value: 'Painting', label: 'Painting' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Digital', label: 'Digital Art' },
  { value: 'Photography', label: 'Photography' },
  { value: 'Installation', label: 'Installation' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'most_liked', label: 'Most Liked' },
  { value: 'top_rated', label: 'Top Rated' },
];

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isTypeOpen, setIsTypeOpen] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(true);
  
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() || '');
  
  const handlePriceChange = () => {
    onFilterChange({
      ...filters,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };
  
  const handleTypeChange = (type: ArtworkType) => {
    onFilterChange({
      ...filters,
      artworkType: filters.artworkType === type ? undefined : type,
    });
  };
  
  const handleSortChange = (sortBy: string) => {
    onFilterChange({
      ...filters,
      sortBy: sortBy as SearchFilters['sortBy'],
    });
  };
  
  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({
      query: filters.query,
      page: 1,
    });
  };
  
  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.artworkType || filters.sortBy;
  
  return (
    <div className="w-full md:w-72 bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-stone-800">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gallery-600 hover:text-gallery-700"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Sort By */}
      <div className="mb-4 border-b border-stone-100 pb-4">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-stone-700"
        >
          Sort By
          {isSortOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {isSortOpen && (
          <div className="mt-2 space-y-2">
            {SORT_OPTIONS.map(option => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={filters.sortBy === option.value}
                  onChange={() => handleSortChange(option.value)}
                  className="w-4 h-4 text-gallery-600 focus:ring-gallery-500"
                />
                <span className="text-sm text-stone-600">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      {/* Price Range */}
      <div className="mb-4 border-b border-stone-100 pb-4">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-stone-700"
        >
          Price Range
          {isPriceOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {isPriceOpen && (
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onBlur={handlePriceChange}
              onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handlePriceChange();
          }
        }}
              className="w-1/2 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gallery-500 text-stone-700"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onBlur={handlePriceChange}
              onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handlePriceChange();
          }
        }}
              className="w-1/2 px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gallery-500 text-stone-700"
            />
          </div>
        )}
      </div>
      
      {/* Artwork Type */}
      <div className="mb-4">
        <button
          onClick={() => setIsTypeOpen(!isTypeOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-stone-700"
        >
          Artwork Type
          {isTypeOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        {isTypeOpen && (
          <div className="mt-2 space-y-2">
            {ARTWORK_TYPES.map(type => (
              <label key={type.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.artworkType === type.value}
                  onChange={() => handleTypeChange(type.value)}
                  className="w-4 h-4 text-gallery-600 rounded focus:ring-gallery-500"
                />
                <span className="text-sm text-stone-600">{type.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}