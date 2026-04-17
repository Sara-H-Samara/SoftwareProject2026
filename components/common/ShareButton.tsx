import { TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
}

export function ShareButton({ title, url, description }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      await Share.share({ message: `${title}\n${description || ""}\n${url}` });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} className="p-2">
      <Ionicons name="share-outline" size={22} color="#78716c" />
    </TouchableOpacity>
  );
}