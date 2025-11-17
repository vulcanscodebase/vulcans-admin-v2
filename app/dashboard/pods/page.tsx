"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getAllPods } from "@/components/api/adminApi";
import { toast } from "sonner";
import CreatePodDialog from "@/components/dashboard/CreatePodDialog";
import PodsTable from "@/components/dashboard/PodsTable";

export default function PodsPage() {
  const { admin, isSuperAdmin } = useAdminAuth();
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error("Access denied. Super admin only.");
      return;
    }
    loadPods();
  }, [isSuperAdmin]);

  const loadPods = async () => {
    try {
      setLoading(true);
      const res = await getAllPods();
      setPods(res.data?.pods || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load pods");
    } finally {
      setLoading(false);
    }
  };

  const handlePodCreated = () => {
    setShowCreatePod(false);
    loadPods();
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only accessible to super admins.</CardDescription>
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

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">All Pods</h1>
              <p className="text-muted-foreground">
                Manage and monitor all pods in the system
              </p>
            </div>
            <Button
              onClick={() => setShowCreatePod(true)}
              className="bg-vulcan-accent-blue hover:bg-vulcan-accent-blue/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Pod
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pod Management</CardTitle>
              <CardDescription>
                View, edit, delete, and manage all pods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading pods...</div>
              ) : (
                <PodsTable pods={pods} onRefresh={loadPods} />
              )}
            </CardContent>
          </Card>

          {showCreatePod && (
            <CreatePodDialog
              open={showCreatePod}
              onClose={() => setShowCreatePod(false)}
              onSuccess={handlePodCreated}
            />
          )}
        </div>
      </main>
    </div>
  );
}

