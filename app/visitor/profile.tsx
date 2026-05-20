import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile, useUpdateProfilePicture } from "@/hooks/useAuth";
import { useState, useRef } from "react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getInitials, formatDate } from "@/utils/helpers";

export default function VisitorProfilePage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: updatePicture, isPending: isUploading } = useUpdateProfilePicture();

  

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const file = {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any;
      updatePicture(file);
    }
  };

  const handleSave = () => {
    updateProfile({ displayName, bio });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            clearAuth();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <View className="bg-white rounded-xl p-4 mb-4">
        <View className="items-center">
          <TouchableOpacity onPress={pickImage} disabled={isUploading}>
            {user?.profilePicUrl ? (
              <Image source={{ uri: user.profilePicUrl }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600 items-center justify-center">
                <Text className="text-white text-3xl font-bold">
                  {getInitials(user?.displayName)}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-gallery-600 rounded-full p-1.5">
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          {isEditing ? (
            <View className="w-full mt-4">
              <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
              <Input
                label="Bio"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={3}
                className="mt-3"
              />
              <View className="flex-row gap-3 mt-4">
                <Button onPress={handleSave} isLoading={isUpdating} className="flex-1">
                  Save
                </Button>
                <Button variant="secondary" onPress={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </View>
            </View>
          ) : (
            <View className="w-full mt-4 items-center">
              <Text className="font-display text-xl font-bold text-stone-800">{user?.displayName || "Art Enthusiast"}</Text>
              <Text className="text-stone-500">{user?.email}</Text>
              {bio && <Text className="text-stone-600 mt-2 text-center">{bio}</Text>}
              <Button onPress={() => setIsEditing(true)} variant="secondary" className="mt-4">
                Edit Profile
              </Button>
            </View>
          )}
        </View>
      </View>

      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="font-semibold text-stone-800 mb-3">Account Information</Text>
        <InfoRow label="Email" value={user?.email ?? "—"} />
        <InfoRow label="Account Type" value={user?.userType ?? "—"} />
        <InfoRow label="Member Since" value={user?.createdAt ? formatDate(user.createdAt) : "—"} />
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-red-500 py-4 rounded-xl items-center justify-center flex-row mb-8"
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text className="text-white font-bold text-lg ml-2">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2 border-b border-stone-100">
      <Text className="text-stone-500">{label}</Text>
      <Text className="text-stone-700">{value}</Text>
    </View>
  );
}