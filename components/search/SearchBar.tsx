import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, onSearch, placeholder = "Search..." }: SearchBarProps) {
  return (
    <View className="flex-row items-center bg-white border border-stone-200 rounded-xl px-3 py-2">
      <Ionicons name="search-outline" size={20} color="#a8a29e" />
      <TextInput
        className="flex-1 ml-2 text-base text-stone-800"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={18} color="#a8a29e" />
        </TouchableOpacity>
      )}
    </View>
  );
}