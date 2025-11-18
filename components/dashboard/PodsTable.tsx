"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Trash2,
  RotateCcw,
  BarChart3,
  Users,
  MoreVertical,
  Search,
  GitBranch,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  softDeletePod,
  restorePod,
  getPodAnalytics,
} from "@/components/api/adminApi";
import { toast } from "sonner";

interface PodsTableProps {
  pods: any[];
  onRefresh: () => void;
  isSuperAdmin?: boolean;
}

export default function PodsTable({ pods, onRefresh, isSuperAdmin = true }: PodsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Build tree structure and filter
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
        }
      } else {
        rootPods.push(podNode);
      }
    });

    return rootPods;
  };

  const filteredPods = pods.filter((pod) =>
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

  const handleViewPod = (podId: string) => {
    router.push(`/dashboard/pods/${podId}`);
  };

  const handleDeletePod = async (podId: string) => {
    if (!confirm("Are you sure you want to delete this pod? This action can be undone.")) {
      return;
    }

    try {
      setDeletingId(podId);
      await softDeletePod(podId);
      toast.success("Pod deleted successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete pod");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestorePod = async (podId: string) => {
    try {
      setRestoringId(podId);
      await restorePod(podId);
      toast.success("Pod restored successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore pod");
    } finally {
      setRestoringId(null);
    }
  };

  const handleViewAnalytics = async (podId: string) => {
    router.push(`/dashboard/pods/${podId}/analytics`);
  };

  if (filteredPods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchTerm ? "No pods found matching your search." : "No pods found. Create your first pod to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search pods by name or email..."
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
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {displayPods.map((pod) => (
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
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {pod.type || "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {pod.associatedEmail || pod.email || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {pod.isDeleted ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Deleted
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPod(pod._id)}
                      className="text-vulcan-accent-blue hover:text-vulcan-accent-blue/80"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAnalytics(pod._id)}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    {pod.isDeleted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestorePod(pod._id)}
                        disabled={restoringId === pod._id}
                        className="text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    ) : (
                      // Regular admins can only delete child pods, not root pods
                      (isSuperAdmin || pod.parentPodId) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePod(pod._id)}
                          disabled={deletingId === pod._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

