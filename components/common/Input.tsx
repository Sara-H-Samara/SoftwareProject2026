import { TextInput, View, Text, TextInputProps } from "react-native";
import { cn } from "@/utils/cn";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  rightElement,
  className,
  ...props
}: InputProps) {
  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-medium text-stone-700">{label}</Text>}
      <View className="relative">
        <TextInput
          className={cn(
            "bg-white border rounded-xl px-4 py-3 text-base text-stone-800",
            error ? "border-red-400" : "border-stone-200",
            rightElement ? "pr-10" : "",
            className
          )}
          placeholderTextColor="#a8a29e"
          {...props}
        />
        {rightElement && (
          <View className="absolute right-3 top-0 bottom-0 justify-center">
            {rightElement}
          </View>
        )}
      </View>
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  );
}