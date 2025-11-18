"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw, Eye, Search, AlertTriangle, GitBranch } from "lucide-react";
import { getDeletedPods, restorePod, permanentlyDeletePod } from "@/components/api/adminApi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PodBinPage() {
  const { isSuperAdmin } = useAdminAuth();
  const router = useRouter();
  const [deletedPods, setDeletedPods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push("/dashboard");
      return;
    }
    loadDeletedPods();
  }, [isSuperAdmin, router]);

  const loadDeletedPods = async () => {
    try {
      setLoading(true);
      const res = await getDeletedPods();
      const allPods = res.data?.pods || [];
      // Filter to only show deleted pods
      setDeletedPods(allPods.filter((pod: any) => pod.isDeleted));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load deleted pods");
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePod = async (podId: string) => {
    try {
      setRestoringId(podId);
      await restorePod(podId);
      toast.success("Pod restored successfully");
      loadDeletedPods();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore pod");
    } finally {
      setRestoringId(null);
    }
  };

  const handleViewPod = (podId: string) => {
    router.push(`/dashboard/pods/${podId}`);
  };

  const handlePermanentDelete = async (podId: string, podName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `⚠️ WARNING: This will permanently delete "${podName}" from the database.\n\n` +
      `This action CANNOT be undone. All data associated with this pod will be lost.\n\n` +
      `Are you absolutely sure you want to proceed?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(podId);
      await permanentlyDeletePod(podId);
      toast.success("Pod permanently deleted");
      loadDeletedPods();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to permanently delete pod");
    } finally {
      setDeletingId(null);
    }
  };

  // Build tree structure similar to PodsTable
  const buildPodTree = (pods: any[]) => {
    const podMap = new Map<string, any>();
    const rootPods: any[] = [];

    // First pass: create map of all pods
    pods.forEach((pod) => {
      podMap.set(pod._id, { ...pod, children: [] });
    });

    // Second pass: build tree structure
    pods.forEach((pod) => {
      const podNode = podMap.get(pod._id);
      if (pod.parentPodId) {
        const parentId = typeof pod.parentPodId === "object" 
          ? pod.parentPodId._id 
          : pod.parentPodId;
        const parent = podMap.get(parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(podNode);
        } else {
          // Parent not found in deleted pods, but still show as child
          rootPods.push(podNode);
        }
      } else {
        rootPods.push(podNode);
      }
    });

    return rootPods;
  };

  const filteredPods = deletedPods.filter(
    (pod) =>
      pod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pod.associatedEmail || pod.email)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const podTree = buildPodTree(filteredPods);

  // Flatten tree for display with level info
  const flattenTree = (nodes: any[], level: number = 0): any[] => {
    const result: any[] = [];
    nodes.forEach((node) => {
      result.push({ ...node, displayLevel: level });
      if (node.children && node.children.length > 0) {
        result.push(...flattenTree(node.children, level + 1));
      }
    });
    return result;
  };

  const displayPods = flattenTree(podTree);

  // Helper function to check if parent is deleted
  const isParentDeleted = (pod: any): boolean => {
    if (!pod.parentPodId) return false;
    const parentId = typeof pod.parentPodId === "object" 
      ? pod.parentPodId._id 
      : pod.parentPodId;
    const parent = deletedPods.find((p) => p._id === parentId);
    return parent ? parent.isDeleted : false;
  };

  // Helper function to get parent name
  const getParentName = (pod: any): string | null => {
    if (!pod.parentPodId) return null;
    if (typeof pod.parentPodId === "object" && pod.parentPodId.name) {
      return pod.parentPodId.name;
    }
    const parentId = typeof pod.parentPodId === "object" 
      ? pod.parentPodId._id 
      : pod.parentPodId;
    const parent = deletedPods.find((p) => p._id === parentId);
    return parent ? parent.name : null;
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="h-8 w-8 text-muted-foreground" />
              <h1 className="text-3xl font-bold text-foreground">Pod Bin</h1>
            </div>
            <p className="text-muted-foreground">
              View, restore, or permanently delete pods. Permanently deleted pods cannot be recovered.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deleted Pods</CardTitle>
              <CardDescription>
                {deletedPods.length} deleted pod{deletedPods.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading deleted pods...</div>
              ) : filteredPods.length === 0 ? (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No deleted pods found matching your search."
                      : "No deleted pods found. The bin is empty."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search deleted pods by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-vulcan-accent-blue"
                    />
                  </div>

                  {/* Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Pod Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Parent Pod
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Deleted At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {displayPods.map((pod) => {
                          const parentDeleted = isParentDeleted(pod);
                          const parentName = getParentName(pod);
                          // Can restore if: no parent OR parent is not deleted
                          const canRestore = !pod.parentPodId || !parentDeleted;
                          
                          return (
                            <tr key={pod._id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2" style={{ paddingLeft: `${pod.displayLevel * 24}px` }}>
                                  {pod.displayLevel > 0 && (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <GitBranch className="h-3 w-3" />
                                      <span className="text-xs">└─</span>
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {pod.name}
                                      {pod.displayLevel > 0 && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center gap-1">
                                          <GitBranch className="h-3 w-3" />
                                          Child
                                        </span>
                                      )}
                                    </div>
                                    {(pod.institutionName || pod.instituteName) && (
                                      <div className="text-sm text-muted-foreground">
                                        {pod.institutionName || pod.instituteName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                  {pod.type || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {parentName ? (
                                  <span className="flex items-center gap-1">
                                    {parentName}
                                    {parentDeleted && (
                                      <span className="text-xs text-red-600 dark:text-red-400" title="Parent is in bin">
                                        (in bin)
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {pod.associatedEmail || pod.email || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                {pod.deletedAt
                                  ? new Date(pod.deletedAt).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewPod(pod._id)}
                                    className="text-vulcan-accent-blue hover:text-vulcan-accent-blue/80"
                                    title="View Pod"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (!canRestore) {
                                        toast.error(`Cannot restore child pod. Parent pod "${parentName}" is still in the bin. Please restore the parent pod first.`);
                                        return;
                                      }
                                      handleRestorePod(pod._id);
                                    }}
                                    disabled={restoringId === pod._id || deletingId === pod._id || !canRestore}
                                    className={`${!canRestore ? "opacity-50 cursor-not-allowed" : "text-green-600 hover:text-green-700"}`}
                                    title={!canRestore ? `First restore parent pod "${parentName}" to restore this child` : "Restore Pod"}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handlePermanentDelete(pod._id, pod.name)}
                                    disabled={restoringId === pod._id || deletingId === pod._id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Permanently Delete Pod"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

