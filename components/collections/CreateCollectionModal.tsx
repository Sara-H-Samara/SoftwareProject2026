import { View, Text, TextInput, TouchableOpacity, Modal, Switch } from "react-native";
import { useState } from "react";
import { useCreateCollection } from "@/hooks/useCollections";
import { Button } from "@/components/common/Button";
import { Ionicons } from "@expo/vector-icons";

interface CreateCollectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateCollectionModal({ visible, onClose }: CreateCollectionModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const { mutate: createCollection, isPending } = useCreateCollection();

  const handleSubmit = () => {
    if (!name.trim()) return;
    createCollection(
      { name: name.trim(), description: description.trim() || undefined, isPublic },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-md p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-semibold text-stone-800 text-lg">New Collection</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#a8a29e" />
            </TouchableOpacity>
          </View>
          <TextInput
            className="border border-stone-200 rounded-xl px-4 py-3 mb-3 text-stone-800"
            placeholder="Collection name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="border border-stone-200 rounded-xl px-4 py-3 mb-3 text-stone-800"
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-stone-700">Make public</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: "#8b5cf6" }} />
          </View>
          <Button onPress={handleSubmit} isLoading={isPending}>
            Create Collection
          </Button>
        </View>
      </View>
    </Modal>
  );
}