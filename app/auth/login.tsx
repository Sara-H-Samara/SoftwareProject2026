import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Ionicons } from "@expo/vector-icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = () => {
    if (!email || !password) return;
    login({ email, password });
  };

  return (
    <ScrollView className="flex-1 bg-stone-50" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 justify-center px-6 py-12">
        <View className="items-center mb-8">
          <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-gallery-500 to-purple-600 items-center justify-center">
            <Text className="text-white font-bold text-xl">V</Text>
          </View>
          <Text className="font-display text-3xl font-bold text-stone-800 mt-4">
            Welcome back
          </Text>
          <Text className="text-stone-500 text-center mt-2">
            Sign in to your Virtual Art Gallery account
          </Text>
        </View>

        <View className="gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#a8a29e"
                />
              </TouchableOpacity>
            }
          />
          <Link href="/forgot-password" className="self-end">
            <Text className="text-gallery-600 text-sm">Forgot password?</Text>
          </Link>
          <Button onPress={handleSubmit} isLoading={isPending}>
            Sign in
          </Button>
        </View>

        <View className="mt-8">
          <Text className="text-center text-stone-500">
            No account yet?{" "}
            <Link href="/auth/register" asChild>
              <Text className="text-gallery-600 font-medium">Create one free</Text>
            </Link>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}