"use client";

import { useState, useEffect } from "react";
import { getAllAdmins, deleteAdmin } from "@/components/api/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminsList() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAllAdmins();
      setAdmins(res.data || []);
      setSelectedAdminIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = (adminId: string) => {
    setSelectedAdminIds((prev) =>
      prev.includes(adminId) ? prev.filter((id) => id !== adminId) : [...prev, adminId]
    );
  };

  const handleToggleAllAdmins = () => {
    if (selectedAdminIds.length === admins.length) {
      setSelectedAdminIds([]);
    } else {
      setSelectedAdminIds(admins.map((a) => String(a._id)));
    }
  };

  const handleBulkDeleteAdmins = async () => {
    if (selectedAdminIds.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedAdminIds.length} admin(s)?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedAdminIds.map((id) => deleteAdmin(id))
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} admin(s) successfully.`);
      }
      if (failureCount > 0) {
        toast.error(
          `Failed to delete ${failureCount} admin(s). Check console for details.`
        );
        console.error("Bulk delete admins results:", results);
      }

      setSelectedAdminIds([]);
      setSelectionMode(false);
      loadAdmins();
    } catch (error: any) {
      console.error("Bulk delete admins error:", error);
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete selected admins"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading admins...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Admins</CardTitle>
        <CardDescription>View all admin users in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Selection toggle + bulk actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectionMode
              ? selectedAdminIds.length > 0
                ? `${selectedAdminIds.length} admin(s) selected`
                : "Selection mode: choose admins to delete"
              : "Bulk selection disabled"}
          </div>
          {selectionMode ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteAdmins}
                disabled={selectedAdminIds.length === 0 || loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedAdminIds([]);
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
                setSelectedAdminIds([]);
              }}
            >
              Select
            </Button>
          )}
        </div>

        {admins.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No admins found.</p>
        ) : (
          <div className="space-y-4">
              {admins.map((admin) => {
                const adminId = String(admin._id);
                return (
                  <div
                  key={adminId}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {selectionMode && (
                      <input
                        type="checkbox"
                        aria-label={`Select admin ${admin.name || admin.email}`}
                        checked={selectedAdminIds.includes(adminId)}
                        onChange={() => handleToggleAdmin(adminId)}
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{admin.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {admin.email} • Role: {admin.role?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
