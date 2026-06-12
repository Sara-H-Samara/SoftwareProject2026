import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { SearchFilters, ArtworkType } from "@/types";
import { ARTWORK_TYPES } from "@/utils/constants";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "most_liked", label: "Most Liked" },
  { value: "top_rated", label: "Top Rated" },
];

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const [showPrice, setShowPrice] = useState(true);
  const [showType, setShowType] = useState(true);
  const [showSort, setShowSort] = useState(true);

  const applyPrice = () => {
    onFilterChange({
      ...filters,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    onFilterChange({ query: filters.query, sortBy: "newest", pageSize: 12 });
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.artworkType || filters.sortBy !== "newest";

  return (
    <View>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-stone-800">Filters</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text className="text-xs text-gallery-600">Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort By */}
      <TouchableOpacity
        onPress={() => setShowSort(!showSort)}
        className="flex-row justify-between items-center py-3 border-t border-stone-100"
      >
        <Text className="font-semibold text-stone-700">Sort By</Text>
        <Ionicons name={showSort ? "chevron-up" : "chevron-down"} size={16} color="#78716c" />
      </TouchableOpacity>
      {showSort && (
        <View className="mb-4">
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onFilterChange({ ...filters, sortBy: opt.value as any })}
              className="flex-row items-center py-2"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  filters.sortBy === opt.value ? "border-gallery-500" : "border-stone-300"
                }`}
              >
                {filters.sortBy === opt.value && <View className="w-3 h-3 rounded-full bg-gallery-500" />}
              </View>
              <Text className="text-stone-600">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Price Range */}
      <TouchableOpacity
        onPress={() => setShowPrice(!showPrice)}
        className="flex-row justify-between items-center py-3 border-t border-stone-100"
      >
        <Text className="font-semibold text-stone-700">Price Range</Text>
        <Ionicons name={showPrice ? "chevron-up" : "chevron-down"} size={16} color="#78716c" />
      </TouchableOpacity>
      {showPrice && (
        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-stone-700"
            placeholder="Min"
            value={minPrice}
            onChangeText={setMinPrice}
            onBlur={applyPrice}
            keyboardType="numeric"
          />
          <TextInput
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-stone-700"
            placeholder="Max"
            value={maxPrice}
            onChangeText={setMaxPrice}
            onBlur={applyPrice}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Artwork Type */}
      <TouchableOpacity
        onPress={() => setShowType(!showType)}
        className="flex-row justify-between items-center py-3 border-t border-stone-100"
      >
        <Text className="font-semibold text-stone-700">Artwork Type</Text>
        <Ionicons name={showType ? "chevron-up" : "chevron-down"} size={16} color="#78716c" />
      </TouchableOpacity>
      {showType && (
        <View className="mb-4">
          {ARTWORK_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() =>
                onFilterChange({
                  ...filters,
                  artworkType: filters.artworkType === type ? undefined : type,
                })
              }
              className="flex-row items-center py-2"
            >
              <View
                className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                  filters.artworkType === type ? "bg-gallery-500 border-gallery-500" : "border-stone-300"
                }`}
              >
                {filters.artworkType === type && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="text-stone-600">{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}