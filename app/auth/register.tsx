import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useRegister } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Ionicons } from "@expo/vector-icons";
import type { UserType } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    userType: "Visitor" as UserType,
    galleryName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "At least 8 characters";
    } else if (!/[A-Z]/.test(form.password)) {
      newErrors.password = "Must contain uppercase letter";
    } else if (!/[0-9]/.test(form.password)) {
      newErrors.password = "Must contain a number";
    } else if (!/[^A-Za-z0-9]/.test(form.password)) {
      newErrors.password = "Must contain special character";
    }

    if (!form.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (form.userType === "Artist" && !form.galleryName.trim()) {
      newErrors.galleryName = "Gallery name is required for artists";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    register(
      {
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        userType: form.userType,
        galleryName: form.userType === "Artist" ? form.galleryName.trim() : undefined,
      },
      {
        onSuccess: (data) => {
          Alert.alert("Success", "Account created successfully!");
          router.replace(
            data.user.userType === "Artist" ? "/dashboard/dashboard" : "/galleries"
          );
        },
        onError: (error: any) => {
          Alert.alert(
            "Registration Failed",
            error?.response?.data?.error || "Something went wrong"
          );
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-stone-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-14 h-14 rounded-xl bg-gradient-to-br from-gallery-500 to-purple-600 items-center justify-center shadow-md">
            <Text className="text-white font-bold text-2xl">V</Text>
          </View>
          <Text className="font-display text-3xl font-bold text-stone-800 mt-4">
            Create account
          </Text>
          <Text className="text-stone-500 text-center mt-2">
            Join Virtual Art Gallery — free forever for students
          </Text>
        </View>

        {/* User Type Selection */}
        <Text className="text-sm font-medium text-stone-700 mb-2">I am a…</Text>
        <View className="flex-row gap-3 mb-4">
          {(["Artist", "Visitor"] as UserType[]).map((type) => {
            const isSelected = form.userType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setForm({ ...form, userType: type })}
                className={`flex-1 py-3 rounded-xl border items-center ${
                  isSelected
                    ? "bg-gallery-500 border-gallery-500"
                    : "bg-white border-stone-200"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isSelected ? "text-white" : "text-stone-600"
                  }`}
                >
                  {type === "Artist" ? "🎨 Artist" : "👁 Visitor"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Display Name */}
        <Input
          label="Display name"
          value={form.displayName}
          onChangeText={(text) => setForm({ ...form, displayName: text })}
          placeholder="Your public name"
          autoCapitalize="words"
          error={errors.displayName}
        />

        {/* Gallery Name (Artist only) */}
        {form.userType === "Artist" && (
          <View className="mt-4">
            <Input
              label="Gallery name"
              value={form.galleryName}
              onChangeText={(text) => setForm({ ...form, galleryName: text })}
              placeholder="e.g. Jane's Modern Space"
              error={errors.galleryName}
            />
            <Text className="text-xs text-stone-400 mt-1">
              This is what visitors will see when browsing.
            </Text>
          </View>
        )}

        {/* Email */}
        <View className="mt-4">
          <Input
            label="Email"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email}
          />
        </View>

        {/* Password */}
        <View className="mt-4">
          <Input
            label="Password"
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
            placeholder="Min. 8 characters"
            secureTextEntry={!showPassword}
            error={errors.password}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#a8a29e"
                />
              </TouchableOpacity>
            }
          />
          <Text className="text-xs text-stone-400 mt-1">
            Must include uppercase, number, and special character.
          </Text>
        </View>

        {/* Submit */}
        <Button onPress={handleSubmit} isLoading={isPending} className="mt-8" size="lg">
          Create account
        </Button>

        {/* Terms */}
        <Text className="text-xs text-stone-400 text-center mt-4">
          By registering you agree to our{" "}
          <Text className="text-gallery-600">Terms of Service</Text> and{" "}
          <Text className="text-gallery-600">Privacy Policy</Text>.
        </Text>

        {/* Sign In Link */}
        <View className="flex-row justify-center mt-8 pb-8">
          <Text className="text-stone-500">Already have an account? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-gallery-600 font-medium">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}