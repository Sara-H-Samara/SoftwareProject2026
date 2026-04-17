import { Stack, usePathname, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { View } from "react-native";
import "../global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const pathname = usePathname();
  const isFullScreen3D = pathname.includes("/3d");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {/* SafeAreaView يضمن عدم تغطية النافبار للـ notch */}
          <SafeAreaView className="flex-1 bg-stone-50" edges={["top"]}>
            {!isFullScreen3D && (
              <>
                <Navbar />
                <Breadcrumb />
              </>
            )}
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "#fafaf9" },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              
              <Stack.Screen name="galleries/index" />
              <Stack.Screen name="galleries/[artistId]" />
              <Stack.Screen name="galleries/[artistId]/3d" />
              <Stack.Screen name="artwork/[id]" />
              <Stack.Screen name="activity" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="checkout-success" />
              <Stack.Screen name="orders/index" />
              <Stack.Screen name="orders/[id]" />
              <Stack.Screen name="collections/index" />
              <Stack.Screen name="collections/[id]" />
              <Stack.Screen name="visitor/profile" />
              <Stack.Screen name="settings/notifications" />
            </Stack>
          </SafeAreaView>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}