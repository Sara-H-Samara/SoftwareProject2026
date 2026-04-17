import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireArtist?: boolean;
}

export function ProtectedRoute({ children, requireArtist = false }: ProtectedRouteProps) {
  const { isAuthenticated, isArtist } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (requireArtist && !isArtist) {
    return <Redirect href="/galleries" />;
  }

  return <>{children}</>;
}