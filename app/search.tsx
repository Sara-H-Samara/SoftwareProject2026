import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useInfiniteSearch } from "@/hooks/useSearch";
import { ArtworkCard } from "@/components/search/ArtworkCard";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { PageLoader } from "@/components/common/Spinner";
import { Ionicons } from "@expo/vector-icons";
import type { SearchFilters } from "@/types";

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({ query: "", sortBy: "newest", pageSize: 12 });
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.query || "");

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteSearch(filters);
  const allArtworks = data?.pages.flatMap((p) => p.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const handleSearch = () => {
    setFilters({ ...filters, query: searchInput });
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  if (isLoading && allArtworks.length === 0) {
    return <PageLoader message="Searching artworks..." />;
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

      {/* Results Header & Filter Toggle */}
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
        data={allArtworks}
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
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#8b5cf6" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-12">
              <Ionicons name="image-outline" size={48} color="#d6d3d1" />
              <Text className="text-stone-500 mt-2">No artworks found</Text>
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
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
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                className="bg-gallery-600 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-medium">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}