import { useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export default function ResetPasswordPage() {
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleSubmit = () => {
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    resetPassword(
      { email: email!, token: token!, newPassword: password },
      { onSuccess: () => router.replace("/login") }
    );
  };

  if (!email || !token) {
    return (
      <View className="flex-1 bg-stone-50 justify-center p-6">
        <Text className="text-red-500 text-center">Invalid reset link</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 justify-center p-6">
      <Text className="font-display text-3xl font-bold text-stone-800 mb-2">New password</Text>
      <Text className="text-stone-500 mb-6">Choose a strong password for your account.</Text>

      <Input
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder="Min. 8 characters"
        secureTextEntry
      />
      <Input
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter password"
        secureTextEntry
        error={error}
        className="mt-4"
      />

      <Button onPress={handleSubmit} isLoading={isPending} className="mt-4">
        Reset password
      </Button>
    </View>
  );
}