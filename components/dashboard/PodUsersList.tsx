"use client";

import { useState, useEffect, useRef } from "react";
import { getPodUsers, addPodUser, deletePodUser, getPodById, previewPodUsersExcel, bulkAddPodUsers } from "@/components/api/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Award, Upload, X, UserPlus, Download } from "lucide-react";

interface PodUsersListProps {
  podId: string;
}

export default function PodUsersList({ podId }: PodUsersListProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    qualification: "",
    dob: "",
    licenses: 0,
  });
  const [podInfo, setPodInfo] = useState<any>(null);
  
  // Excel upload states
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUsers();
    loadPodInfo();
  }, [podId, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await getPodUsers(podId, page, 10);
      setUsers(res.data?.users || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadPodInfo = async () => {
    try {
      const res = await getPodById(podId);
      setPodInfo(res.data?.pod || null);
    } catch (error: any) {
      console.error("Failed to load pod info:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPodUser(podId, newUser);
      toast.success("User added successfully!");
      setShowAddUser(false);
      setNewUser({ name: "", email: "", qualification: "", dob: "", licenses: 0 });
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deletePodUser(podId, userId);
      toast.success("User deleted successfully!");
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setExcelFile(file);
    setUploadingExcel(true);

    try {
      const res = await previewPodUsersExcel(podId, file);
      setPreviewData(res.data);
      toast.success(`Preview loaded: ${res.data.newUsers?.length || 0} new users, ${res.data.existingUsers?.length || 0} existing`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to preview Excel file");
      setExcelFile(null);
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!previewData) {
      toast.error("No preview data available");
      return;
    }

    try {
      setUploadingExcel(true);
      await bulkAddPodUsers(podId, {
        newUsers: previewData.newUsers || [],
        existingUsers: previewData.existingUsers || [],
        invalidEmails: previewData.invalidEmails || [],
      });
      toast.success("Users uploaded successfully!");
      setShowExcelUpload(false);
      setExcelFile(null);
      setPreviewData(null);
      loadUsers();
      loadPodInfo(); // Reload pod info to update license counts
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload users");
    } finally {
      setUploadingExcel(false);
    }
  };

  const cancelExcelUpload = () => {
    setShowExcelUpload(false);
    setExcelFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `Name,Unique ID,Email,Licenses
John Doe,STU001,john@example.com,5
Jane Smith,STU002,jane@example.com,10
Bob Wilson,EMP001,bob@example.com,3`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "pod_users_template.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template downloaded! Open in Excel and fill in your data.");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pod Users</CardTitle>
            <CardDescription>Manage users in this pod</CardDescription>
            {podInfo && (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Pod Licenses:</span>
                  <span className="text-green-600 font-semibold">
                    {podInfo.availableLicenses || 0} available
                  </span>
                  <span className="text-gray-500">
                    / {podInfo.totalLicenses || 0} total
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExcelUpload(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Excel
            </Button>
            <Button onClick={() => setShowAddUser(true)} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Excel Upload Section */}
        {showExcelUpload && (
          <div className="mb-6 p-4 border-2 border-dashed rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Bulk Upload Users via Excel
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload an Excel file with columns: Name, Unique ID, Email, Licenses
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelExcelUpload}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Download Template Button */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Download the Excel template with correct format
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* File Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploadingExcel}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: .xlsx, .xls, .csv
                </p>
              </div>

              {/* Format Info */}
              <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                <p className="font-medium mb-2">📋 Excel Format:</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="border p-2 text-left">Column A</th>
                        <th className="border p-2 text-left">Column B</th>
                        <th className="border p-2 text-left">Column C</th>
                        <th className="border p-2 text-left">Column D</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-2 font-medium">Name</td>
                        <td className="border p-2 font-medium">Unique ID</td>
                        <td className="border p-2 font-medium">Email</td>
                        <td className="border p-2 font-medium">Licenses</td>
                      </tr>
                      <tr className="text-gray-600 dark:text-gray-400">
                        <td className="border p-2">John Doe</td>
                        <td className="border p-2">STU001</td>
                        <td className="border p-2">john@example.com</td>
                        <td className="border p-2">5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <strong>Note:</strong> Unique ID is optional. Licenses must be a number.
                </p>
              </div>

              {/* Preview */}
              {previewData && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">New Users</p>
                      <p className="text-2xl font-bold text-green-600">
                        {previewData.newUsers?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Existing Users</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {previewData.existingUsers?.length || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Invalid Emails</p>
                      <p className="text-2xl font-bold text-red-600">
                        {previewData.invalidEmails?.length || 0}
                      </p>
                    </div>
                  </div>

                  {previewData.invalidEmails && previewData.invalidEmails.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        Invalid Emails:
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {previewData.invalidEmails.join(", ")}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleBulkUpload}
                      disabled={uploadingExcel || (previewData.newUsers?.length === 0 && previewData.existingUsers?.length === 0)}
                      className="flex-1"
                    >
                      {uploadingExcel ? "Uploading..." : `Upload ${(previewData.newUsers?.length || 0) + (previewData.existingUsers?.length || 0)} Users`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={cancelExcelUpload}
                      disabled={uploadingExcel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {uploadingExcel && !previewData && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Processing Excel file...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Add User Section */}
        {showAddUser && (
          <form onSubmit={handleAddUser} className="mb-4 p-4 border rounded-lg bg-white dark:bg-gray-800 space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={newUser.qualification}
                onChange={(e) => setNewUser({ ...newUser, qualification: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="licenses">Interview Licenses *</Label>
              <Input
                id="licenses"
                type="number"
                min="0"
                value={newUser.licenses}
                onChange={(e) => setNewUser({ ...newUser, licenses: parseInt(e.target.value) || 0 })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of interviews this user can take
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Add User</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div>Loading users...</div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No users found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteUser(user._id)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

