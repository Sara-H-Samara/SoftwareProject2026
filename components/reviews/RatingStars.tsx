import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}

export function RatingStars({ rating, maxRating = 5, size = 'md', interactive = false, onRatingChange, readonly = false }: RatingStarsProps) {
  const sizes = { sm: 16, md: 22, lg: 32 };
  const iconSize = sizes[size];

  const handlePress = (selected: number) => {
    if (!interactive || readonly) return;
    onRatingChange?.(selected);
  };

  return (
    <View className="flex-row gap-1">
      {Array.from({ length: maxRating }).map((_, i) => {
        const star = i + 1;
        const filled = star <= rating;
        return (
          <TouchableOpacity
            key={star}
            onPress={() => handlePress(star)}
            disabled={!interactive || readonly}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={iconSize}
              color={filled ? '#fbbf24' : '#d6d3d1'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}