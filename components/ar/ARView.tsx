import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.184:5005";

interface ARViewProps {
  artwork: {
    id: string;
    title: string;
    imageUrl: string;
  };
  onClose: () => void;
}

function fixImageUrl(url?: string) {
  if (!url) return "";

  const host = API_BASE.replace(/^https?:\/\//, "").split(":")[0];

  return url
    .replace("http://localhost", `http://${host}`)
    .replace("https://localhost", `http://${host}`)
    .replace("http://127.0.0.1", `http://${host}`)
    .replace("https://127.0.0.1", `http://${host}`);
}

export function ARView({ artwork, onClose }: ARViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const imageUrl = useMemo(() => {
    const fixed = fixImageUrl(artwork.imageUrl);
    return fixed;
  }, [artwork.imageUrl]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastTranslateX.current = translateX;
        lastTranslateY.current = translateY;
      },
      onPanResponderMove: (_, gesture) => {
        setTranslateX(lastTranslateX.current + gesture.dx);
        setTranslateY(lastTranslateY.current + gesture.dy);
      },
      onPanResponderRelease: () => {
        lastTranslateX.current = translateX;
        lastTranslateY.current = translateY;
      },
    })
  ).current;

  const increaseScale = () => {
    setScale((current) => Math.min(2.5, current + 0.1));
  };

  const decreaseScale = () => {
    setScale((current) => Math.max(0.4, current - 0.1));
  };

  const resetTransform = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  const frameWidth = 220;
  const frameHeight = 280;
  const imageWidth = frameWidth - 20;
  const imageHeight = frameHeight - 20;

  if (!permission) {
    return (
      <View style={StyleSheet.absoluteFillObject} className="bg-black" />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        className="bg-black justify-center items-center p-6"
      >
        <Ionicons name="camera-outline" size={56} color="white" />
        <Text className="text-white text-lg font-bold mt-4 text-center">
          Camera access is needed for AR
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-gallery-600 px-6 py-3 rounded-xl mt-5"
        >
          <Text className="text-white font-medium">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} className="mt-5">
          <Text className="text-white/70">Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-black">
      <StatusBar hidden />
      
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        mode="picture"
      />

      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "transparent" },
        ]}
        pointerEvents="box-none"
      >
        <View className="absolute top-12 left-0 right-0 z-30 px-4">
          <View className="bg-black/60 backdrop-blur-md rounded-full py-2 px-4 self-center">
            <Text className="text-white text-xs font-medium">
              🖼️ {artwork.title}
            </Text>
          </View>
          <Text className="text-center text-white/60 text-[10px] mt-2">
            Drag to move · Use controls to resize
          </Text>
        </View>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: "absolute",
            top: height / 2 - frameHeight / 2,
            left: width / 2 - frameWidth / 2,
            width: frameWidth * scale,
            height: frameHeight * scale,
            transform: [{ translateX }, { translateY }],
          }}
        >
          {/* الظل خلف الإطار */}
          <View
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              right: 4,
              bottom: 4,
              backgroundColor: "rgba(0,0,0,0.3)",
              borderRadius: 16,
            }}
          />

          {/* الإطار الخارجي الذهبي */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#d4a843",
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 10,
            }}
          />

          {/* الحافة البيضاء الداخلية (المات) */}
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              right: 8,
              bottom: 8,
              backgroundColor: "#f5f0eb",
              borderRadius: 12,
            }}
          />

          {/* منطقة الصورة */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              bottom: 12,
              backgroundColor: "#0a0a0a",
              borderRadius: 8,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isLoading && (
              <View className="absolute inset-0 justify-center items-center bg-black/70 z-10">
                <ActivityIndicator size="large" color="#d4a843" />
                <Text className="text-white text-xs mt-2">Loading...</Text>
              </View>
            )}

            {!imageFailed && imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: imageWidth * scale,
                  height: imageHeight * scale,
                }}
                resizeMode="contain"
                onLoadStart={() => setIsLoading(true)}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setImageFailed(true);
                  setIsLoading(false);
                }}
              />
            ) : (
              <View className="flex-1 bg-stone-800 justify-center items-center">
                <Ionicons name="image-outline" size={40} color="#666" />
                <Text className="text-white/60 text-xs mt-2 text-center px-4">
                  {artwork.title}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-4 z-30">
          <TouchableOpacity
            onPress={decreaseScale}
            className="bg-black/60 backdrop-blur-md w-12 h-12 rounded-full items-center justify-center active:bg-black/80"
          >
            <Ionicons name="remove-outline" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={increaseScale}
            className="bg-black/60 backdrop-blur-md w-12 h-12 rounded-full items-center justify-center active:bg-black/80"
          >
            <Ionicons name="add-outline" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={resetTransform}
            className="bg-black/60 backdrop-blur-md w-12 h-12 rounded-full items-center justify-center active:bg-black/80"
          >
            <Ionicons name="refresh-outline" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="bg-red-600/80 w-12 h-12 rounded-full items-center justify-center active:bg-red-700"
          >
            <Ionicons name="close-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="absolute bottom-28 left-0 right-0 items-center">
          <View className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex-row items-center gap-2">
            <Ionicons name="resize-outline" size={12} color="white" />
            <Text className="text-white/80 text-xs">
              {Math.round(scale * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}