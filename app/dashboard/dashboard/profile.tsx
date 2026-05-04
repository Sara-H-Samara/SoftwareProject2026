import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert } from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile, useUpdateProfilePicture } from "@/hooks/useAuth";
import { useArtistStats } from "@/hooks/useFollows";
import { useUserBadges } from "@/hooks/useBadges";
import { getInitials, formatDate } from "@/utils/helpers";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  const { data: stats } = useArtistStats(user?.id || "");
  const { data: badges } = useUserBadges(user?.id || "");
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: updatePicture, isPending: isUploadingPic } = useUpdateProfilePicture();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [galleryName, setGalleryName] = useState(user?.galleryName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const file = { uri: result.assets[0].uri, name: "profile.jpg", type: "image/jpeg" } as any;
      updatePicture(file);
    }
  };

  const handleSave = () => {
    updateProfile({ displayName, galleryName, bio });
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
      {/* بطاقة البروفايل */}
      <View className="bg-white rounded-2xl p-6 border border-stone-100 mb-6">
        <View className="items-center">
          <TouchableOpacity onPress={pickImage} disabled={isUploadingPic}>
            {user?.profilePicUrl ? (
              <Image source={{ uri: user.profilePicUrl }} className="w-24 h-24 rounded-full" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-gradient-to-br from-gallery-500 to-purple-600 items-center justify-center">
                <Text className="text-white text-3xl font-bold">{getInitials(user?.displayName)}</Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-gallery-600 rounded-full p-1.5">
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="font-display text-xl font-bold text-stone-800 mt-4">{user?.displayName}</Text>
          {badges && badges.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {badges.map((badge, idx) => <Badge key={idx} type={badge as any} size="sm" />)}
            </View>
          )}
        </View>

        {isEditing ? (
          <View className="mt-4 gap-4">
            <Input label="Display name" value={displayName} onChangeText={setDisplayName} />
            <Input label="Gallery name" value={galleryName} onChangeText={setGalleryName} />
            <View>
              <Text className="text-sm font-medium text-stone-700 mb-1">Bio</Text>
              <TextInput
                className="bg-white border border-stone-200 rounded-xl p-3 text-stone-800"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />
            </View>
            <View className="flex-row gap-3">
              <Button onPress={handleSave} isLoading={isUpdating} className="flex-1">Save</Button>
              <Button variant="secondary" onPress={() => setIsEditing(false)} className="flex-1">Cancel</Button>
            </View>
          </View>
        ) : (
          <Button onPress={() => setIsEditing(true)} variant="secondary" className="mt-4">
            Edit Profile
          </Button>
        )}
      </View>

      {/* الإحصائيات */}
      {stats && (
        <View className="flex-row gap-4 mb-4">
          <StatCard value={stats.totalArtworks} label="Artworks" icon="images-outline" />
          <StatCard value={stats.totalLikes} label="Likes" icon="heart-outline" />
          <StatCard value={stats.totalFollowers} label="Followers" icon="people-outline" />
          <StatCard value={stats.averageRating.toFixed(1)} label="Rating" icon="star-outline" />
        </View>
      )}

      {/* معلومات الحساب */}
      <View className="bg-white rounded-2xl p-4 border border-stone-100 mb-6">
        <Text className="font-semibold text-stone-800 mb-3">Account Information</Text>
        <InfoRow label="Email" value={user?.email ?? "—"} />
        <InfoRow label="Account Type" value={user?.userType ?? "—"} />
        <InfoRow label="Member Since" value={user?.createdAt ? formatDate(user.createdAt) : "—"} />
      </View>

      {/* زر تسجيل الخروج */}
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

function StatCard({ value, label, icon }: any) {
  return (
    <View className="flex-1 bg-white rounded-xl p-3 border border-stone-100 items-center">
      <Ionicons name={icon as any} size={20} color="#8b5cf6" />
      <Text className="text-lg font-bold text-stone-800 mt-1">{value}</Text>
      <Text className="text-xs text-stone-500">{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <View className="flex-row justify-between py-2 border-b border-stone-100">
      <Text className="text-stone-500">{label}</Text>
      <Text className="text-stone-700">{value}</Text>
    </View>
  );
}