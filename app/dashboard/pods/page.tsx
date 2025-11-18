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
    loadPods();
  }, [isSuperAdmin]);

  const loadPods = async () => {
    try {
      setLoading(true);
      // getAllPods automatically filters by admin via JWT token
      // Super admins see all pods, regular admins see only their pods
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
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {isSuperAdmin ? "All Pods" : "My Pods"}
              </h1>
              <p className="text-muted-foreground">
                {isSuperAdmin 
                  ? "Manage and monitor all pods in the system"
                  : "View and manage your assigned pods"}
              </p>
            </div>
            {isSuperAdmin && (
              <Button
                onClick={() => setShowCreatePod(true)}
                className="bg-vulcan-accent-blue hover:bg-vulcan-accent-blue/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Pod
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isSuperAdmin ? "Pod Management" : "My Pods"}</CardTitle>
              <CardDescription>
                {isSuperAdmin 
                  ? "View, edit, delete, and manage all pods"
                  : "View and manage your assigned pods"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vulcan-accent-blue mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading pods...</p>
                </div>
              ) : pods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {isSuperAdmin ? "No pods found." : "You don't have any pods assigned."}
                  </p>
                </div>
              ) : (
                <PodsTable pods={pods} onRefresh={loadPods} isSuperAdmin={isSuperAdmin} />
              )}
            </CardContent>
          </Card>

          {showCreatePod && isSuperAdmin && (
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

