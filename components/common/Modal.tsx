import { Modal as RNModal, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <RNModal visible={isOpen} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-md p-5">
          <View className="flex-row justify-between items-center mb-4">
            {title && <Text className="text-lg font-semibold text-stone-800">{title}</Text>}
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#a8a29e" />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}