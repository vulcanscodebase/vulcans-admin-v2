"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPodById, getPodUsers } from "@/components/api/adminApi";
import { toast } from "sonner";
import PodUsersList from "./PodUsersList";

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();
  const [pod, setPod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (admin?.podId) {
      loadPod();
    } else {
      setLoading(false);
    }
  }, [admin]);

  const loadPod = async () => {
    try {
      setLoading(true);
      const res = await getPodById(admin?.podId || "");
      setPod(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load pod");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!admin?.podId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>No Pod Assigned</CardTitle>
            <CardDescription>
              You don't have a pod assigned. Please contact a super admin.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {pod && (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>{pod.name}</CardTitle>
                  <CardDescription>Pod Information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium">Type</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pod.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pod.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pod Users */}
              <PodUsersList podId={admin.podId} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

