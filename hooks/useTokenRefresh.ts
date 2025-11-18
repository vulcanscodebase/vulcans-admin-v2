"use client";

import { useEffect, useRef } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";

/**
 * Hook to automatically refresh token before expiration
 * Refreshes token every 50 minutes (tokens expire in 1 hour)
 */
export function useTokenRefresh() {
  const { refreshToken, token } = useAdminAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Refresh token every 50 minutes (3000000 ms)
    // This ensures we refresh before the 1-hour expiration
    intervalRef.current = setInterval(async () => {
      try {
        console.log("🔄 Auto-refreshing token...");
        await refreshToken();
        console.log("✅ Token refreshed successfully");
      } catch (error) {
        console.error("❌ Auto token refresh failed:", error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    // Cleanup on unmount or token change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, refreshToken]);
}

