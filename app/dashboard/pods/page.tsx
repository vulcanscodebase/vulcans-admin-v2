"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Building2 } from "lucide-react";
import { getAllPods } from "@/components/api/adminApi";
import { toast } from "sonner";
import CreatePodDialog from "@/components/dashboard/CreatePodDialog";
import PodsTable from "@/components/dashboard/PodsTable";

export default function PodsPage() {
  const { admin, isSuperAdmin } = useAdminAuth();
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [pods, setPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "deleted">("active");

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
      // Load all pods including deleted ones
      const res = await getAllPods(true);
      setPods(res.data?.pods || []);
    } catch (error: any) {
      console.error("Error loading pods:", error);
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
            {activeTab === "active" && (
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
              <CardTitle>Pod Management</CardTitle>
              <CardDescription>
                View, edit, delete, and manage all pods
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <div className="border-b mb-6">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === "active"
                        ? "border-vulcan-accent-blue text-vulcan-accent-blue"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Active Pods</span>
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {pods.filter((p) => !p.isDeleted).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("deleted")}
                    className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === "deleted"
                        ? "border-vulcan-accent-blue text-vulcan-accent-blue"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Pod Bin</span>
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {pods.filter((p) => p.isDeleted).length}
                    </span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading pods...</div>
              ) : (
                <PodsTable
                  pods={
                    activeTab === "active"
                      ? pods.filter((p) => !p.isDeleted)
                      : pods.filter((p) => p.isDeleted)
                  }
                  onRefresh={loadPods}
                />
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

