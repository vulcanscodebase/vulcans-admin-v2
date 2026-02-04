"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, BarChart3, Building2, Award, Trash2, FileText } from "lucide-react";
import {
  getPodById,
  getPodUsers,
  getPodAnalytics,
  getPodHierarchy,
  permanentlyDeletePod,
} from "@/components/api/adminApi";
import { toast } from "sonner";
import PodUsersList from "@/components/dashboard/PodUsersList";
import PodLicenseManagement from "@/components/dashboard/PodLicenseManagement";
import PodReportsList from "@/components/dashboard/PodReportsList";

export default function PodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSuperAdmin } = useAdminAuth();
  const podId = params.podId as string;

  const [pod, setPod] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [totalRemainingInterviews, setTotalRemainingInterviews] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "hierarchy" | "licenses" | "reports">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "users", "analytics", "hierarchy", "licenses", "reports"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPodData();
  }, [podId, isSuperAdmin]);

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

      // Calculate total remaining interviews for all users in pod
      if (isSuperAdmin) {
        try {
          let allUsers: any[] = [];
          let currentPage = 1;
          let hasMore = true;

          // Fetch all users (paginated)
          while (hasMore) {
            const usersRes = await getPodUsers(podId, currentPage, 100);
            const users = usersRes.data?.users || [];
            allUsers = [...allUsers, ...users];
            
            const totalPages = usersRes.data?.totalPages || 1;
            if (currentPage >= totalPages) {
              hasMore = false;
            } else {
              currentPage++;
            }
          }

          // Calculate total remaining interviews
          const totalRemaining = allUsers.reduce((sum, user) => {
            return sum + (user.licenses || 0);
          }, 0);

          setTotalRemainingInterviews(totalRemaining);
        } catch (error) {
          console.error("Error calculating total remaining interviews:", error);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load pod data");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!pod) return;

    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY delete the pod "${pod.name}" and ALL its data.\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`;
    const userInput = prompt(confirmMessage);
    
    if (userInput !== "DELETE") {
      toast.info("Permanent delete cancelled");
      return;
    }

    try {
      await permanentlyDeletePod(podId);
      toast.success("Pod permanently deleted successfully");
      router.push("/dashboard/pods");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to permanently delete pod");
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
    // Commented out as per request - keep only main Reports section for admin/super admin
    // { id: "reports", label: "Reports", icon: FileText },
    ...(isSuperAdmin ? [{ id: "licenses", label: "Licenses", icon: Award }] : []),
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
            <div className="flex justify-between items-start mb-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="destructive"
                  onClick={handlePermanentDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently Delete Pod
                </Button>
              )}
            </div>
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

              {/* Total Remaining Interviews Card (Super Admin Only) */}
              {isSuperAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-600" />
                      Total Remaining Interviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-blue-600 mb-2">
                          {totalRemainingInterviews}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total remaining interviews across all users in this pod
                        </p>
                      </div>
                    </div>
                    {pod.totalLicenses !== undefined && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Pod License Pool</p>
                            <p className="font-semibold">{pod.totalLicenses || 0}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Assigned to Users</p>
                            <p className="font-semibold">{pod.assignedLicenses || 0}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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

          {/* Commented out as per request - keep only main Reports section for admin/super admin */}
          {/* {activeTab === "reports" && <PodReportsList podId={podId} />} */}

          {activeTab === "licenses" && isSuperAdmin && (
            <PodLicenseManagement
              podId={podId}
              podName={pod.name}
              totalLicenses={pod.totalLicenses || 0}
              assignedLicenses={pod.assignedLicenses || 0}
              availableLicenses={pod.availableLicenses || 0}
              onUpdate={loadPodData}
            />
          )}

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
                  <div className="space-y-6">
                    {/* Current Pod */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                            {hierarchy.pod?.name || "Current Pod"}
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Type: {hierarchy.pod?.type || "N/A"} | Level: {hierarchy.pod?.nestingLevel || 0}
                          </p>
                          {hierarchy.pod?.path && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Path: {hierarchy.pod.path}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
                          Current
                        </span>
                      </div>
                    </div>

                    {/* Parent Pod */}
                    {hierarchy.parent ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Parent Pod
                        </h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{hierarchy.parent.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                Type: {hierarchy.parent.type} | Level: {hierarchy.parent.nestingLevel || 0}
                              </p>
                              {hierarchy.parent.path && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Path: {hierarchy.parent.path}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/pods/${hierarchy.parent._id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-muted-foreground">No parent pod (root level)</p>
                      </div>
                    )}

                    {/* Child Pods */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Child Pods ({hierarchy.children?.length || 0})
                      </h4>
                      {hierarchy.children && hierarchy.children.length > 0 ? (
                        <div className="space-y-2">
                          {hierarchy.children.map((child: any) => (
                            <div
                              key={child._id}
                              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{child.name}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Type: {child.type} | Level: {child.nestingLevel || 0}
                                  </p>
                                  {child.path && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Path: {child.path}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/pods/${child._id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-muted-foreground">No child pods</p>
                        </div>
                      )}
                    </div>
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

