"use client";

import { useState } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { massUploadPreview, massUploadUsers } from "@/components/api/adminApi";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Users,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PreviewData {
  summary: {
    totalRows: number;
    validRows: number;
    invalidEmails: string[];
    podsFound: number;
    missingPods: string[];
  };
  usersByPod: {
    [podName: string]: Array<{
      name: string;
      email: string;
      uniqueId?: string;
      licenses: number;
    }>;
  };
  pods: Array<{
    id: string;
    name: string;
    type: string;
    currentLicenses: {
      total: number;
      assigned: number;
      available: number;
    };
  }>;
}

export default function MassUploadPage() {
  const { admin, isSuperAdmin } = useAdminAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Redirect if not super admin
  if (!isSuperAdmin) {
    router.push("/dashboard");
    return null;
  }

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent = `Name,UniqueID,Email,Licenses,PodName
John Doe,STU001,john@email.com,5,CS Department
Jane Smith,STU002,jane@email.com,3,CS Department
Bob Wilson,EMP001,bob@company.com,10,IT Training Pod`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mass_upload_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded!");
  };

  const handleFileSelect = (file: File) => {
    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      toast.error("Please upload an Excel file (.xlsx, .xls) or CSV (.csv)");
      return;
    }
    setSelectedFile(file);
    setPreviewData(null);
    setUploadResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const response = await massUploadPreview(selectedFile);
      setPreviewData(response.data);

      if (response.data.summary.invalidEmails.length > 0) {
        toast.warning(
          `${response.data.summary.invalidEmails.length} invalid emails found`
        );
      }
      if (response.data.summary.missingPods.length > 0) {
        toast.error(`Some pods not found: ${response.data.summary.missingPods.join(", ")}`);
      } else {
        toast.success("Preview loaded successfully!");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to preview Excel file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !previewData) return;

    if (previewData.summary.missingPods.length > 0) {
      toast.error("Cannot upload: Some pods don't exist");
      return;
    }

    try {
      setIsUploading(true);
      const response = await massUploadUsers(selectedFile);
      setUploadResult(response.data);
      toast.success("Mass upload completed successfully!");
      setSelectedFile(null);
      setPreviewData(null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to upload users"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
              <Upload className="mr-3 h-8 w-8 text-vulcan-accent-blue" />
              Super Admin - Mass Upload Users
            </h1>
            <p className="text-muted-foreground">
              Upload a single Excel file to add users to multiple pods at once
            </p>
          </div>

          {/* Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Download the Excel template below</li>
                <li>
                  Fill in user details: Name, UniqueID, Email, Licenses, PodName
                </li>
                <li>Upload the completed Excel file</li>
                <li>Review the preview to verify data</li>
                <li>Click "Upload All Users" to add them to their respective pods</li>
              </ol>
              <div className="mt-4">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="text-vulcan-accent-blue border-vulcan-accent-blue hover:bg-vulcan-accent-blue hover:text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-vulcan-accent-blue bg-blue-50"
                    : "border-gray-300"
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {selectedFile
                    ? `Selected: ${selectedFile.name}`
                    : "Drag & Drop Excel file here"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse (.xlsx, .xls, .csv)
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>

              {selectedFile && !previewData && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handlePreview}
                    disabled={isLoading}
                    className="bg-vulcan-accent-blue text-white hover:bg-vulcan-accent-blue/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Preview...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Preview Data
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Data */}
          {previewData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Preview
                </CardTitle>
                <CardDescription>
                  Review the data before uploading
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Rows</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {previewData.summary.totalRows}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Valid Users</p>
                    <p className="text-2xl font-bold text-green-600">
                      {previewData.summary.validRows}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Pods Found</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {previewData.summary.podsFound}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Licenses</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Object.values(previewData.usersByPod)
                        .flat()
                        .reduce((sum, user) => sum + (user.licenses || 0), 0)}
                    </p>
                  </div>
                </div>

                {/* Errors */}
                {(previewData.summary.invalidEmails.length > 0 ||
                  previewData.summary.missingPods.length > 0) && (
                  <div className="mb-4">
                    {previewData.summary.invalidEmails.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                        <p className="text-sm font-medium text-yellow-800 flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Invalid Emails ({previewData.summary.invalidEmails.length})
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          {previewData.summary.invalidEmails.join(", ")}
                        </p>
                      </div>
                    )}
                    {previewData.summary.missingPods.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm font-medium text-red-800 flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Pods Not Found ({previewData.summary.missingPods.length})
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {previewData.summary.missingPods.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Users by Pod */}
                <div className="space-y-4">
                  {Object.entries(previewData.usersByPod).map(
                    ([podName, users]) => (
                      <div
                        key={podName}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="font-semibold text-lg mb-2 flex items-center text-vulcan-dark">
                          <Package className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                          {podName} ({users.length} users)
                        </h3>
                        <div className="space-y-2">
                          {users.slice(0, 5).map((user, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                            >
                              <span className="flex items-center">
                                <Users className="mr-2 h-4 w-4 text-gray-500" />
                                <span className="font-medium">{user.name}</span>
                                <span className="text-gray-500 ml-2">
                                  ({user.email})
                                </span>
                              </span>
                              <span className="text-vulcan-accent-blue font-medium">
                                {user.licenses} licenses
                              </span>
                            </div>
                          ))}
                          {users.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              ...and {users.length - 5} more users
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Upload Button */}
                <div className="mt-6 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewData(null);
                      setSelectedFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      isUploading ||
                      previewData.summary.missingPods.length > 0
                    }
                    className="bg-vulcan-accent-blue text-white hover:bg-vulcan-accent-blue/90"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Upload All Users to Pods
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="mr-2 h-6 w-6" />
                  Upload Successful!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Pods Affected</p>
                      <p className="text-2xl font-bold text-green-600">
                        {uploadResult.summary.totalPodsAffected}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Users Added</p>
                      <p className="text-2xl font-bold text-green-600">
                        {uploadResult.summary.totalUsersAdded}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Users Updated</p>
                      <p className="text-2xl font-bold text-green-600">
                        {uploadResult.summary.totalUsersUpdated}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Licenses Assigned</p>
                      <p className="text-2xl font-bold text-green-600">
                        {uploadResult.summary.totalLicensesAssigned}
                      </p>
                    </div>
                  </div>

                  {/* Pod Results */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Results by Pod:</h4>
                    <div className="space-y-2">
                      {uploadResult.podResults.map((result: any) => (
                        <div
                          key={result.podId}
                          className="bg-white p-3 rounded border border-green-200"
                        >
                          <p className="font-medium">{result.podName}</p>
                          <p className="text-sm text-gray-600">
                            Added: {result.usersAdded} | Updated:{" "}
                            {result.usersUpdated} | Total: {result.totalUsers}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setUploadResult(null);
                      setSelectedFile(null);
                    }}
                    className="w-full mt-4"
                  >
                    Upload Another File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

