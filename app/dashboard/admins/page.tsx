"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { getAllAdmins, deleteAdmin } from "@/components/api/adminApi";
import { toast } from "sonner";

export default function AdminsPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error("Access denied. Super admin only.");
      return;
    }
    loadAdmins();
  }, [isSuperAdmin]);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAllAdmins();
      console.log("Loaded admins:", res.data);
      setAdmins(res.data || []);
    } catch (error: any) {
      console.error("Error loading admins:", error);
      toast.error(error.response?.data?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!adminId) {
      toast.error("Invalid admin ID");
      return;
    }

    if (!confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log("Deleting admin with ID:", adminId);
      await deleteAdmin(adminId);
      toast.success(`Admin "${adminName}" deleted successfully!`);
      loadAdmins(); // Reload the list
    } catch (error: any) {
      console.error("Delete admin error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete admin";
      toast.error(errorMessage);
    }
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
              <h1 className="text-3xl font-bold text-foreground mb-2">All Admins</h1>
              <p className="text-muted-foreground">
                Manage admin users and their permissions
              </p>
            </div>
            <Button className="bg-vulcan-accent-blue hover:bg-vulcan-accent-blue/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Admin
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Admin Users</CardTitle>
              <CardDescription>
                View and manage all admin accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading admins...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No admins found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div
                      key={admin._id || admin.id}
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h3 className="font-semibold">{admin.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {admin.email} • Role:{" "}
                          {typeof admin.role === "string"
                            ? admin.role
                            : admin.role?.name || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {admin.isSuperAdmin && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Super Admin
                          </span>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {!admin.isSuperAdmin && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const adminId = admin._id || admin.id;
                              if (!adminId) {
                                toast.error("Admin ID not found");
                                return;
                              }
                              handleDeleteAdmin(String(adminId), admin.name);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

