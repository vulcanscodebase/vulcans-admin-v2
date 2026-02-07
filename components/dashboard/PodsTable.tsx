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
}

export default function PodsTable({ pods, onRefresh }: PodsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [selectedPodIds, setSelectedPodIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const filteredPods = pods.filter((pod) =>
    pod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pod.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    router.push(`/dashboard/pods/${podId}?tab=analytics`);
  };

  const handleTogglePod = (podId: string) => {
    setSelectedPodIds((prev) =>
      prev.includes(podId) ? prev.filter((id) => id !== podId) : [...prev, podId]
    );
  };

  const handleToggleAllPods = () => {
    if (selectedPodIds.length === filteredPods.length) {
      setSelectedPodIds([]);
    } else {
      setSelectedPodIds(filteredPods.map((p) => String(p._id)));
    }
  };

  const handleBulkDeletePods = async () => {
    if (selectedPodIds.length === 0) return;

    const showingDeleted = pods.length > 0 && pods[0]?.isDeleted;
    const action = showingDeleted ? "restore" : "delete";

    if (!confirm(`Are you sure you want to ${action} ${selectedPodIds.length} pod(s)?`)) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedPodIds.map((id) => showingDeleted ? restorePod(id) : softDeletePod(id))
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`${action === "delete" ? "Deleted" : "Restored"} ${successCount} pod(s) successfully.`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to ${action} ${failureCount} pod(s).`);
      }

      setSelectedPodIds([]);
      setSelectionMode(false);
      onRefresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to ${action} pods`);
    }
  };

  const showingDeleted = pods.length > 0 && pods[0]?.isDeleted;

  if (filteredPods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchTerm
            ? "No pods found matching your search."
            : showingDeleted
            ? "Pod Bin is empty. No deleted pods."
            : "No pods found. Create your first pod to get started."}
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

      {/* Selection toggle + bulk actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectionMode
            ? selectedPodIds.length > 0
              ? `${selectedPodIds.length} pod(s) selected`
              : `Selection mode: choose pods to ${showingDeleted ? "restore" : "delete"}`
            : "Bulk selection disabled"}
        </div>
        {selectionMode ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={showingDeleted ? "default" : "destructive"}
              size="sm"
              onClick={handleBulkDeletePods}
              disabled={selectedPodIds.length === 0}
              className={showingDeleted ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {showingDeleted ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Restore Selected
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectionMode(false);
                setSelectedPodIds([]);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectionMode(true);
              setSelectedPodIds([]);
            }}
          >
            Select
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {selectionMode && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all pods"
                    checked={selectedPodIds.length === filteredPods.length && filteredPods.length > 0}
                    onChange={handleToggleAllPods}
                  />
                </th>
              )}
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
            {filteredPods.map((pod) => {
              const podId = String(pod._id);
              const isSelected = selectedPodIds.includes(podId);
              return (
                <tr key={podId} className="hover:bg-muted/50 transition-colors">
                  {selectionMode && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select pod ${pod.name}`}
                        checked={isSelected}
                        onChange={() => handleTogglePod(podId)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{pod.name}</div>
                    {pod.instituteName && (
                      <div className="text-sm text-muted-foreground">
                        {pod.instituteName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {pod.type || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {pod.email}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePod(pod._id)}
                          disabled={deletingId === pod._id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
