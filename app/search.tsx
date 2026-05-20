import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useInfiniteSearch } from "@/hooks/useSearch";
import { useMyArtworks } from "@/hooks/useArtworks";
import { useAuthStore } from "@/store/authStore";
import { ArtworkCard } from "@/components/search/ArtworkCard";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import type { SearchFilters, Artwork } from "@/types";

export default function SearchPage() {
  const { user, isArtist, isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState<SearchFilters>({ query: "", sortBy: "newest", pageSize: 12 });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.query || "");

  const isSearchActive = filters.query && filters.query.trim().length > 0;
  
  // Only fetch my artworks if user is artist (to avoid 403)
  const { data: myArtworks, isLoading: myArtworksLoading } = useMyArtworks();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, error: searchError } = useInfiniteSearch(filters);

  // Determine which data to show
  let displayArtworks: Artwork[] = [];
  let totalCount = 0;
  let isLoadingData = false;
  let errorMessage: string | null = null;

  if (isSearchActive) {
    if (searchError) {
      errorMessage = "Search unavailable. Please try again later.";
    } else {
      displayArtworks = data?.pages.flatMap((p) => p.items) ?? [];
      totalCount = data?.pages[0]?.totalCount ?? 0;
      isLoadingData = isLoading;
    }
  } else {
    // No search query: if artist, show own published artworks; else show nothing
    if (isArtist && myArtworks) {
      displayArtworks = myArtworks.filter((a: Artwork) => a.isPublished);
      totalCount = displayArtworks.length;
      isLoadingData = myArtworksLoading;
    } else {
      // For visitors, show a message to start searching
      displayArtworks = [];
      totalCount = 0;
      isLoadingData = false;
    }
  }

  useEffect(() => {
    if (isSearchActive) {
      refetch();
    }
  }, [filters, refetch, isSearchActive]);

  const handleSearch = () => {
    setFilters({ ...filters, query: searchInput });
  };

  const handleLoadMore = () => {
    if (isSearchActive && hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if ((isLoadingData && displayArtworks.length === 0) || (isSearchActive && isLoading)) {
    return <PageLoader message={isSearchActive ? "Searching..." : "Loading artworks..."} />;
  }

  if (errorMessage) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-red-500 text-center mt-4">{errorMessage}</Text>
        <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-gallery-600 px-4 py-2 rounded-lg">
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50">
      {/* Search Bar */}
      <View className="p-4">
        <View className="flex-row items-center bg-white rounded-xl border border-stone-200 px-4 py-2">
          <Ionicons name="search-outline" size={20} color="#a8a29e" />
          <TextInput
            className="flex-1 ml-2 text-base text-stone-800"
            placeholder="Search artworks, artists..."
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchInput(""); setFilters({ ...filters, query: "" }); }}>
              <Ionicons name="close-circle" size={18} color="#a8a29e" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Header */}
      <View className="flex-row justify-between items-center px-4 mb-2">
        <Text className="text-stone-500 text-sm">{totalCount} results</Text>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          className="flex-row items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-stone-200"
        >
          <Ionicons name="options-outline" size={16} color="#78716c" />
          <Text className="text-sm text-stone-600">Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Artworks Grid */}
      <FlatList
        data={displayArtworks}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View className="flex-1">
            <ArtworkCard artwork={item} />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage && isSearchActive ? (
            <View className="py-4"><ActivityIndicator size="small" color="#8b5cf6" /></View>
          ) : null
        }
        ListEmptyComponent={
          !isLoadingData && displayArtworks.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="image-outline" size={48} color="#d6d3d1" />
              <Text className="text-stone-500 mt-2">
                {isSearchActive ? "No artworks found" : "Start typing to search"}
              </Text>
              {!isSearchActive && !isArtist && (
                <Text className="text-stone-400 text-sm mt-1">Try searching for something</Text>
              )}
            </View>
          ) : null
        }
      />

      {/* Filter Modal (unchanged) */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%]">
            <View className="flex-row justify-between items-center p-4 border-b border-stone-100">
              <Text className="font-semibold text-stone-800 text-lg">Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#78716c" />
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              <FilterSidebar filters={filters} onFilterChange={setFilters} />
            </ScrollView>
            <View className="p-4 border-t border-stone-100">
              <TouchableOpacity onPress={() => setShowFilters(false)} className="bg-gallery-600 py-3 rounded-xl">
                <Text className="text-white text-center font-medium">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}