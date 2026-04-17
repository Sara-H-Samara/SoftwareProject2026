import { View, Text, Switch, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import api from "@/api/axiosInstance";
import { Button } from "@/components/common/Button";
import { PageLoader } from "@/components/common/Spinner";

interface Settings {
  emailLikes: boolean;
  emailFollows: boolean;
  emailComments: boolean;
  emailReviews: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.get("/api/notification-settings").then((res) => {
      setSettings(res.data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await api.put("/api/notification-settings", settings);
    setIsSaving(false);
    alert("Settings saved!");
  };

  if (isLoading) return <PageLoader />;

  const toggle = (key: keyof Settings) => {
    setSettings((prev) => (prev ? { ...prev, [key]: !prev[key] } : null));
  };

  return (
    <ScrollView className="flex-1 bg-stone-50 p-4">
      <Text className="font-display text-2xl font-bold text-stone-800 mb-2">Notifications</Text>
      <Text className="text-stone-500 mb-6">Choose which emails you want to receive.</Text>

      <View className="bg-white rounded-xl p-4">
        <SettingRow
          label="Likes"
          description="When someone likes your artwork"
          value={settings?.emailLikes ?? true}
          onToggle={() => toggle("emailLikes")}
        />
        <SettingRow
          label="Follows"
          description="When someone follows you"
          value={settings?.emailFollows ?? true}
          onToggle={() => toggle("emailFollows")}
        />
        <SettingRow
          label="Comments"
          description="When someone comments on your artwork"
          value={settings?.emailComments ?? true}
          onToggle={() => toggle("emailComments")}
        />
        <SettingRow
          label="Reviews"
          description="When someone reviews your artwork"
          value={settings?.emailReviews ?? true}
          onToggle={() => toggle("emailReviews")}
        />
      </View>

      <Button onPress={handleSave} isLoading={isSaving} className="mt-6">
        Save Settings
      </Button>
    </ScrollView>
  );
}

function SettingRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-stone-100">
      <View className="flex-1 pr-4">
        <Text className="font-medium text-stone-800">{label}</Text>
        <Text className="text-xs text-stone-500">{description}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: "#8b5cf6" }} />
    </View>
  );
}