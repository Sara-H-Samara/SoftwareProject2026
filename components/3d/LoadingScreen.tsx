import { View, Text, ActivityIndicator } from 'react-native';

// Fixed: removed unused Canvas import from @react-three/fiber/native
// which caused a crash when the 3D scene wasn't mounted yet
export const LoadingScreen = () => (
  <View className="absolute inset-0 bg-black/80 items-center justify-center z-20">
    <ActivityIndicator size="large" color="#a855f7" />
    <Text className="text-white mt-4 text-lg">Loading 3D Gallery...</Text>
  </View>
);