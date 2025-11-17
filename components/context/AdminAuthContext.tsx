"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
  adminRefreshToken,
  setupAdminInterceptors,
} from "../api/adminApi";

interface Admin {
  id: string;
  name: string;
  email: string;
  isSuperAdmin?: boolean;
  role?: {
    id: string;
    name: string;
    permissions: Array<{ feature: string; actions: string[] }>;
  } | string; // Can be object or string like "super-admin"
  podId?: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  getAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  token: null,
  isLoading: true,
  isSuperAdmin: false,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => null,
  getAdmin: async () => {},
});

export const useAdminAuth = () => useContext(AdminAuthContext);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const getToken = () => token || localStorage.getItem("adminToken");

  const refreshToken = async (): Promise<string | null> => {
    try {
      const res = await adminRefreshToken();
      const newToken = res.data.token || res.data.accessToken;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("adminToken", newToken);
        return newToken;
      }
      return null;
    } catch (err) {
      logout();
      return null;
    }
  };

  // Setup interceptors
  useEffect(() => {
    setupAdminInterceptors(getToken, refreshToken);
  }, [token]);

  const login = async (data: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const res = await adminLogin(data);
      
      // Token might be in cookies or response
      const accessToken = 
        res.data.token || 
        res.data.accessToken || 
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];

      if (accessToken) {
        setToken(accessToken);
        localStorage.setItem("adminToken", accessToken);
      }

      const adminData = res.data.admin || res.data;
      setAdmin(adminData);
      localStorage.setItem("admin", JSON.stringify(adminData));

      toast.success("Login successful!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setAdmin(null);
      setToken(null);
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      router.push("/login");
    }
  };

  const getAdmin = async () => {
    try {
      const res = await getCurrentAdmin();
      const adminData = res.data.admin || res.data;
      setAdmin(adminData);
      localStorage.setItem("admin", JSON.stringify(adminData));
    } catch (err) {
      logout();
    }
  };

  const isSuperAdmin = 
    admin?.isSuperAdmin === true || 
    admin?.role === "super-admin" ||
    (typeof admin?.role === "object" && admin?.role?.name === "super-admin");

  // Initialize on mount
  useEffect(() => {
    const localToken = localStorage.getItem("adminToken");
    const localAdmin = localStorage.getItem("admin");

    if (localToken) {
      setToken(localToken);
      if (localAdmin) {
        try {
          setAdmin(JSON.parse(localAdmin));
        } catch (e) {
          console.error("Error parsing admin data:", e);
        }
      }
      getAdmin();
    }
    setIsLoading(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        isSuperAdmin,
        login,
        logout,
        refreshToken,
        getAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

