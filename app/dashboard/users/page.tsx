"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, User, Award, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { getAllUsers, deleteUser } from "@/components/api/adminApi";
import { toast } from "sonner";

export default function UsersPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      toast.error("Access denied. Super admin only.");
      return;
    }
    loadUsers();
  }, [isSuperAdmin, page, searchTerm, verifiedFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers(page, limit, searchTerm || undefined, verifiedFilter);
      setUsers(res.data?.users || []);
      setPagination({
        total: res.data?.pagination?.total || 0,
        pages: res.data?.pagination?.pages || 0,
      });
      setSelectedUserIds([]);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;

    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY delete ${selectedUserIds.length} user(s).\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`;
    const userInput = prompt(confirmMessage);

    if (userInput !== "DELETE") {
      toast.info("User deletion cancelled");
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedUserIds.map((id) => deleteUser(id))
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Deleted ${successCount} user(s) successfully.`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to delete ${failureCount} user(s).`);
      }

      setSelectedUserIds([]);
      setSelectionMode(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!userId) {
      toast.error("Invalid user ID");
      return;
    }

    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY delete the user "${userName}".\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`;
    const userInput = prompt(confirmMessage);
    
    if (userInput !== "DELETE") {
      toast.info("User deletion cancelled");
      return;
    }

    try {
      await deleteUser(userId);
      toast.success(`User "${userName}" deleted successfully!`);
      loadUsers(); // Reload the list
    } catch (error: any) {
      console.error("Delete user error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete user";
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">All Users</h1>
            <p className="text-muted-foreground">
              View and manage all user accounts in the system
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Search, filter, and view all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Selection toggle + bulk actions */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectionMode
                    ? selectedUserIds.length > 0
                      ? `${selectedUserIds.length} user(s) selected`
                      : "Selection mode: choose users to delete"
                    : "Bulk selection disabled"}
                </div>
                {selectionMode ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteUsers}
                      disabled={selectedUserIds.length === 0 || loading}
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
                        setSelectedUserIds([]);
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
                      setSelectedUserIds([]);
                    }}
                  >
                    Select
                  </Button>
                )}
              </div>

              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={verifiedFilter === undefined ? "all" : verifiedFilter ? "verified" : "unverified"}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVerifiedFilter(
                        value === "all" ? undefined : value === "verified"
                      );
                      setPage(1);
                    }}
                    className="px-4 py-2 border rounded-md bg-background"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
                  </select>
                  <Button type="submit">Search</Button>
                </form>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Total Users: <strong>{pagination.total}</strong>
                  </span>
                  {verifiedFilter === undefined && (
                    <>
                      <span className="text-muted-foreground">
                        Verified: <strong>{users.filter((u) => u.verified).length}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        Unverified: <strong>{users.filter((u) => !u.verified).length}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Users Table */}
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchTerm ? "No users found matching your search." : "No users found."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                              {selectionMode && (
                                <th className="px-4 py-3 text-left">
                                  <span className="sr-only">Select</span>
                                </th>
                              )}
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Profession
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Licenses
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                            {users.map((user) => {
                              const userId = user._id || user.id;
                              return (
                                <tr key={userId} className="hover:bg-muted/50 transition-colors">
                                  {selectionMode && (
                                    <td className="px-4 py-4">
                                      <input
                                        type="checkbox"
                                        aria-label={`Select user ${user.name}`}
                                        checked={selectedUserIds.includes(String(userId))}
                                        onChange={() => handleToggleUser(String(userId))}
                                      />
                                    </td>
                                  )}
                                  <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-vulcan-accent-blue/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-vulcan-accent-blue" />
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium">{user.name || "N/A"}</div>
                                  {user.uniqueId && (
                                    <div className="text-sm text-muted-foreground">
                                      ID: {user.uniqueId}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm">
                                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                                {user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                {user.profession || (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                              </div>
                              {user.schoolOrCollege && (
                                <div className="text-xs text-muted-foreground">
                                  {user.schoolOrCollege}
                                </div>
                              )}
                              {user.organization && (
                                <div className="text-xs text-muted-foreground">
                                  {user.organization}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-1 text-yellow-600" />
                                <span className="font-semibold">{user.licenses || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.verified ? (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id || user.id, user.name)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                              );
                            })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {page} of {pagination.pages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                          disabled={page === pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

