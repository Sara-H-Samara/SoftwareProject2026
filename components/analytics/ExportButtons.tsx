// @ts-nocheck
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '@/api/axiosInstance';

export function ExportButtons({ months }: { months: number }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportFile = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const response = await api.get(`/api/artworks/analytics/export/${format}?months=${months}`, {
        responseType: 'arraybuffer',
      });
      
      const base64 = btoa(String.fromCharCode(...new Uint8Array(response.data)));
      const fileUri = FileSystem.cacheDirectory + `analytics_report.${format}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('File saved', 'Report saved successfully');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export failed', 'Could not export file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-row gap-2">
      <TouchableOpacity onPress={() => exportFile('csv')} disabled={isExporting} className="bg-white border border-stone-200 px-3 py-2 rounded-lg">
        <Text className="text-stone-600">{isExporting ? '...' : 'CSV'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => exportFile('pdf')} disabled={isExporting} className="bg-white border border-stone-200 px-3 py-2 rounded-lg">
        <Text className="text-stone-600">{isExporting ? '...' : 'PDF'}</Text>
      </TouchableOpacity>
    </View>
  );
}