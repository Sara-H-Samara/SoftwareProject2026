import { View, TouchableOpacity, Text, Alert } from "react-native";
import { useState } from "react";
import api from "@/api/axiosInstance";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

interface ExportButtonsProps {
  months: number;
}

export function ExportButtons({ months }: ExportButtonsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const exportFile = async (format: "csv" | "pdf") => {
    const setLoading = format === "csv" ? setIsExportingCSV : setIsExportingPDF;
    setLoading(true);
    try {
      const response = await api.get(`/api/artworks/analytics/export/${format}?months=${months}`, {
        responseType: "arraybuffer",
      });
      const base64 = btoa(String.fromCharCode(...new Uint8Array(response.data)));
      const uri = FileSystem.cacheDirectory + `analytics_report.${format}`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sharing not available", "File saved to cache.");
      }
    } catch (error) {
      Alert.alert("Export failed", "Could not export file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-row gap-2">
      <TouchableOpacity
        onPress={() => exportFile("csv")}
        disabled={isExportingCSV}
        className="bg-white border border-stone-200 px-3 py-2 rounded-lg flex-row items-center gap-1"
      >
        <Text className="text-stone-600">{isExportingCSV ? "..." : "CSV"}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => exportFile("pdf")}
        disabled={isExportingPDF}
        className="bg-white border border-stone-200 px-3 py-2 rounded-lg flex-row items-center gap-1"
      >
        <Text className="text-stone-600">{isExportingPDF ? "..." : "PDF"}</Text>
      </TouchableOpacity>
    </View>
  );
}