import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, PanResponder, Animated, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ARViewProps {
  artwork: { id: string; title: string; imageUrl: string };
  onClose: () => void;
}

export function ARView({ artwork, onClose }: ARViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  
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
      onPanResponderRelease: () => {},
    })
  ).current;

  const resetTransform = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
  };

  if (!permission) return <View className="flex-1 bg-black" />;
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
      {/* Camera takes full screen */}
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />

      {/* Overlay content - absolutely positioned */}
      <View style={StyleSheet.absoluteFillObject}>
        <Animated.View
          {...panResponder.panHandlers}
          style={{
            position: 'absolute',
            top: height / 2 - 120,
            left: width / 2 - 100,
            width: 200 * scale,
            height: 250 * scale,
            transform: [{ translateX }, { translateY }],
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: '#c8aa6a',
          }}
        >
          <Image
            source={{ uri: artwork.imageUrl || 'https://via.placeholder.com/300?text=Artwork' }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
            <Text className="text-white text-xs text-center">{artwork.title}</Text>
          </View>
        </Animated.View>

        {/* Controls at bottom */}
        <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-4">
          <TouchableOpacity onPress={() => setScale(scale + 0.1)} className="bg-black/60 p-3 rounded-full">
            <Ionicons name="expand-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setScale(scale - 0.1)} className="bg-black/60 p-3 rounded-full">
            <Ionicons name="contract-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetTransform} className="bg-black/60 p-3 rounded-full">
            <Ionicons name="refresh-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="bg-black/60 p-3 rounded-full">
            <Ionicons name="close-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text className="absolute top-12 left-0 right-0 text-center text-white/70 text-xs bg-black/40 py-1">
          Drag to move · Use +/- to resize
        </Text>
      </View>
    </View>
  );
}