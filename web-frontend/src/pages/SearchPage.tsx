import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PhotoIcon,  XMarkIcon } from '@heroicons/react/24/outline';
import { useInfiniteSearch } from '@/hooks/useSearch';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import SearchBar from '@/components/search/SearchBar';
import FilterSidebar from '@/components/search/FilterSidebar';
import ArtworkCard from '@/components/search/ArtworkCard';
import { SkeletonGrid } from '@/components/common/SkeletonGrid';
import type { SearchFilters } from '@/types';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    artworkType: searchParams.get('type') as any,
    sortBy: (searchParams.get('sort') as any) || 'newest',
    pageSize: 12,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteSearch(filters);

  const loadMoreRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
    threshold: 200,
  });

  const allArtworks = data?.pages.flatMap((page) => page.items) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.artworkType) params.set('type', filters.artworkType);
    if (filters.sortBy && filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleSearch = (newFilters: Partial<SearchFilters>) => {
    setFilters({ ...filters, ...newFilters, pageSize: 12 });
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters({ ...newFilters, pageSize: 12 });
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.artworkType || filters.sortBy !== 'newest';

  if (isLoading && allArtworks.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="h-12 w-full max-w-md bg-stone-200 rounded-xl animate-pulse" />
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-72 hidden md:block">
              <div className="h-96 bg-stone-200 rounded-xl animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="h-6 w-48 bg-stone-200 rounded animate-pulse mb-4" />
              <SkeletonGrid count={12} variant="artwork" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} initialQuery={filters.query} />
        </div>

        {/* Mobile filter button */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-600"
          >
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-gallery-500 rounded-full" />
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => handleFilterChange({ query: filters.query, sortBy: 'newest', pageSize: 12 })}
              className="text-xs text-stone-500 hover:text-stone-700"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Mobile filter drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                <h2 className="font-semibold text-stone-800">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-1">
                  <XMarkIcon className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 w-full py-2 bg-gallery-600 text-white rounded-lg text-sm font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden md:block w-72 shrink-0">
            <FilterSidebar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h1 className="text-xl font-bold text-stone-800">
                {totalCount.toLocaleString()} {totalCount === 1 ? 'result' : 'results'}
                {filters.query && (
                  <span className="text-stone-500 font-normal ml-1">
                    for "<span className="font-medium text-gallery-600">{filters.query}</span>"
                  </span>
                )}
              </h1>
              {hasActiveFilters && (
                <button
                  onClick={() => handleFilterChange({ query: filters.query, sortBy: 'newest', pageSize: 12 })}
                  className="hidden md:block text-xs text-stone-500 hover:text-stone-700"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {allArtworks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
                <PhotoIcon className="h-16 w-16 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500 font-medium">No artworks found</p>
                <p className="text-sm text-stone-400 mt-1">Try adjusting your filters or search term</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {allArtworks.map((artwork) => (
                    <ArtworkCard key={artwork.id} artwork={artwork} />
                  ))}
                </div>

                {isFetchingNextPage && (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-gallery-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <div ref={loadMoreRef} className="h-4" />

                {!hasNextPage && allArtworks.length > 0 && (
                  <p className="text-center text-stone-400 text-sm py-8">
                    You've reached the end
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}