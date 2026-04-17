import { TouchableOpacity, Text, Alert, Linking } from "react-native";
import { useState } from "react";
import api from "@/api/axiosInstance";
import { Ionicons } from "@expo/vector-icons";

interface DownloadInvoiceButtonProps {
  orderId: string;
}

export function DownloadInvoiceButton({ orderId }: DownloadInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/orders/${orderId}/invoice`, {
        responseType: "blob",
      });
      const reader = new FileReader();
      reader.onload = () => {
        const html = reader.result as string;
        Alert.alert("Invoice", "Invoice generated. You can view it in your browser.", [
          { text: "OK" },
        ]);
      };
      reader.readAsText(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to download invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleDownload}
      disabled={isLoading}
      className="flex-row items-center gap-2 bg-gallery-600 px-4 py-2 rounded-xl"
    >
      <Ionicons name="document-text-outline" size={18} color="white" />
      <Text className="text-white font-medium">{isLoading ? "Loading..." : "View Invoice"}</Text>
    </TouchableOpacity>
  );
}