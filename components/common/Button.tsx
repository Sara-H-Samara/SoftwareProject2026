import { forwardRef } from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { cn } from "@/utils/cn";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading,
      onPress,
      disabled,
      className,
      leftIcon,
      rightIcon,
      fullWidth,
    },
    ref
  ) => {
    const variants = {
      primary: "bg-gallery-600",
      secondary: "bg-white border border-stone-200",
      ghost: "",
      danger: "bg-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5",
      md: "px-4 py-2.5",
      lg: "px-6 py-3",
    };

    const textSizes = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    };

    const textColors = {
      primary: "text-white",
      secondary: "text-stone-700",
      ghost: "text-stone-600",
      danger: "text-white",
    };

    return (
      <TouchableOpacity
        ref={ref}
        className={cn(
          "rounded-xl flex-row items-center justify-center",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          disabled && "opacity-50",
          className
        )}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={variant === "secondary" ? "#78716c" : "white"} />
        ) : (
          <View className="flex-row items-center gap-2">
            {leftIcon}
            <Text className={cn("font-medium text-center", textSizes[size], textColors[variant])}>
              {children}
            </Text>
            {rightIcon}
          </View>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";