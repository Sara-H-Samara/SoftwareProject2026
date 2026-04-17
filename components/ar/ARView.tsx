import { View, Text, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface ARViewProps {
  artwork: { id: string; title: string; imageUrl: string };
  onClose: () => void;
}

export function ARView({ artwork, onClose }: ARViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isPlacing, setIsPlacing] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-6">
        <Text className="text-white text-lg mb-4">Camera access is needed for AR</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-gallery-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-medium">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1 }} facing="back">
        <View className="flex-1">
          <TouchableOpacity onPress={onClose} className="absolute top-12 right-4 z-10 bg-black/50 p-3 rounded-full">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <View className="absolute bottom-20 left-0 right-0 items-center">
            <TouchableOpacity
              onPress={() => {
                setIsPlacing(!isPlacing);
                Alert.alert("AR Demo", `Artwork "${artwork.title}" placed! (Demo mode)`);
              }}
              className={`px-6 py-3 rounded-full ${isPlacing ? "bg-green-600" : "bg-gallery-600"}`}
            >
              <Text className="text-white font-medium">
                {isPlacing ? "Artwork Placed!" : "Tap to Place Artwork"}
              </Text>
            </TouchableOpacity>
            <Text className="text-white/70 text-xs mt-2">Move your phone to position the artwork</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}