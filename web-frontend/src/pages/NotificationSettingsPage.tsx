import { useState, useEffect } from 'react';
import { BellIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axiosInstance';
import { PageLoader } from '@/components/common/Spinner';
import Button from '@/components/common/Button';

interface NotificationSettings {
  emailLikes: boolean;
  emailFollows: boolean;
  emailComments: boolean;
  emailReviews: boolean;
}

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailLikes: true,
    emailFollows: true,
    emailComments: true,
    emailReviews: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const res = await api.get<NotificationSettings>('/api/notification-settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/api/notification-settings', settings);
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageLoader message="Loading settings..." />;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Notification Settings</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Choose which notifications you want to receive
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gallery-100 flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-gallery-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-800">In-App Notifications</h2>
              <p className="text-xs text-stone-500">You'll see these in your notifications feed</p>
            </div>
          </div>
          <p className="text-sm text-stone-600 mt-4">
            In-app notifications are always enabled. You can manage them from the notifications dropdown.
          </p>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <EnvelopeIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-800">Email Notifications</h2>
              <p className="text-xs text-stone-500">Receive email alerts for important activity</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingToggle
              label="Likes"
              description="When someone likes your artwork"
              enabled={settings.emailLikes}
              onChange={(val) => setSettings({ ...settings, emailLikes: val })}
            />
            <SettingToggle
              label="Follows"
              description="When someone follows you"
              enabled={settings.emailFollows}
              onChange={(val) => setSettings({ ...settings, emailFollows: val })}
            />
            <SettingToggle
              label="Comments"
              description="When someone comments on your artwork"
              enabled={settings.emailComments}
              onChange={(val) => setSettings({ ...settings, emailComments: val })}
            />
            <SettingToggle
              label="Reviews"
              description="When someone reviews your artwork"
              enabled={settings.emailReviews}
              onChange={(val) => setSettings({ ...settings, emailReviews: val })}
            />
          </div>
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-stone-700">{label}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-gallery-600' : 'bg-stone-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}