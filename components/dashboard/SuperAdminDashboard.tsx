"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, BarChart3, TrendingUp } from "lucide-react";
import { getAllPods } from "@/components/api/adminApi";
import { toast } from "sonner";
import CreatePodDialog from "./CreatePodDialog";
import PodsTable from "./PodsTable";

export default function SuperAdminDashboard() {
  const { admin } = useAdminAuth();
  const [showCreatePod, setShowCreatePod] = useState(false);
  const [pods, setPods] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPods: 0,
    activePods: 0,
    totalUsers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPods();
  }, []);

  const loadPods = async () => {
    try {
      setLoading(true);
      const res = await getAllPods();
      const podsData = res.data?.pods || [];
      setPods(podsData);
      
      // Calculate stats
      setStats({
        totalPods: podsData.length,
        activePods: podsData.filter((p: any) => !p.isDeleted).length,
        totalUsers: podsData.reduce((sum: number, p: any) => sum + (p.userCount || 0), 0),
        totalAdmins: 0, // Will be loaded separately
      });
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

      {/* Main Content */}
      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {admin?.name}!
            </h1>
            <p className="text-muted-foreground">
              Manage pods, admins, and monitor system analytics
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-l-4 border-l-vulcan-accent-blue">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pods</CardTitle>
                <Building2 className="h-4 w-4 text-vulcan-accent-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPods}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activePods} active
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Pods</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePods}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all pods
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">View</div>
                <p className="text-xs text-muted-foreground">
                  System insights
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-semibold">All Pods</h2>
            <Button
              onClick={() => setShowCreatePod(true)}
              className="bg-vulcan-accent-blue hover:bg-vulcan-accent-blue/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Pod
            </Button>
          </div>

          {/* Pods Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pod Management</CardTitle>
              <CardDescription>
                View and manage all pods in the system
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

          {/* Create Pod Dialog */}
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
