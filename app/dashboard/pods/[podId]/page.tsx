"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BarChart3, Building2 } from "lucide-react";
import {
  getPodById,
  getPodUsers,
  getPodAnalytics,
  getPodHierarchy,
} from "@/components/api/adminApi";
import { toast } from "sonner";
import PodUsersList from "@/components/dashboard/PodUsersList";

export default function PodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();
  const podId = params.podId as string;

  const [pod, setPod] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "hierarchy">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPodData();
  }, [podId]);

  const loadPodData = async () => {
    try {
      setLoading(true);
      const [podRes, analyticsRes, hierarchyRes] = await Promise.all([
        getPodById(podId),
        getPodAnalytics(podId).catch(() => null),
        getPodHierarchy(podId).catch(() => null),
      ]);

      setPod(podRes.data);
      if (analyticsRes) setAnalytics(analyticsRes.data);
      if (hierarchyRes) setHierarchy(hierarchyRes.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load pod data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
          <AdminSidebar />
        </div>
        <main className="md:ml-64 pt-16 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-8">Loading pod details...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!pod) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
          <AdminSidebar />
        </div>
        <main className="md:ml-64 pt-16 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardHeader>
                <CardTitle>Pod Not Found</CardTitle>
                <CardDescription>The pod you're looking for doesn't exist.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "hierarchy", label: "Hierarchy", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">{pod.name}</h1>
            <p className="text-muted-foreground">{pod.email}</p>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      isActive
                        ? "border-vulcan-accent-blue text-vulcan-accent-blue"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pod Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-lg">{pod.type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg">{pod.email}</p>
                  </div>
                  {pod.instituteName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Institute</p>
                      <p className="text-lg">{pod.instituteName}</p>
                    </div>
                  )}
                  {pod.organizationName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Organization</p>
                      <p className="text-lg">{pod.organizationName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        pod.isDeleted
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {pod.isDeleted ? "Deleted" : "Active"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {pod.parentPodId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Parent Pod</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">This pod has a parent pod</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "users" && <PodUsersList podId={podId} />}

          {activeTab === "analytics" && (
            <Card>
              <CardHeader>
                <CardTitle>Pod Analytics</CardTitle>
                <CardDescription>Statistics and insights for this pod</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{analytics.totalUsers || 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">{analytics.activeUsers || 0}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">
                          {analytics.completionRate ? `${analytics.completionRate}%` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No analytics data available</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "hierarchy" && (
            <Card>
              <CardHeader>
                <CardTitle>Pod Hierarchy</CardTitle>
                <CardDescription>Parent-child relationships</CardDescription>
              </CardHeader>
              <CardContent>
                {hierarchy ? (
                  <div className="space-y-2">
                    <pre className="p-4 bg-muted rounded-lg overflow-auto">
                      {JSON.stringify(hierarchy, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hierarchy data available</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

