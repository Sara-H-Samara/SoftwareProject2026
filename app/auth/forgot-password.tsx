import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSubmit = () => {
    forgotPassword(email, { onSuccess: () => setSubmitted(true) });
  };

  if (submitted) {
    return (
      <View className="flex-1 bg-stone-50 justify-center items-center p-6">
        <Text className="text-xl font-semibold text-stone-800 mb-2">Check your email</Text>
        <Text className="text-stone-500 text-center mb-6">
          If an account with {email} exists, a reset link has been sent.
        </Text>
        <Link href="/login" asChild>
          <Button variant="secondary">Back to Sign In</Button>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-stone-50 justify-center p-6">
      <Text className="font-display text-3xl font-bold text-stone-800 mb-2">Reset password</Text>
      <Text className="text-stone-500 mb-6">Enter your email to receive a reset link.</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Button onPress={handleSubmit} isLoading={isPending} className="mt-4">
        Send reset link
      </Button>

      <Link href="/login" asChild>
        <TouchableOpacity className="mt-4 self-center">
          <Text className="text-gallery-600">← Back to sign in</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}