"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  getPodInterviewReports,
  getPodById,
} from "@/components/api/adminApi";
import { toast } from "sonner";
import {
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Users,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface InterviewReport {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    educationStatus?: string;
    profession?: string;
  };
  jobRole?: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export default function PodInterviewReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, isSuperAdmin } = useAdminAuth();
  const podId = params.podId as string;

  const [interviews, setInterviews] = useState<InterviewReport[]>([]);
  const [pod, setPod] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [statistics, setStatistics] = useState({
    totalInterviews: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (podId) {
      loadPodDetails();
      loadInterviews();
    }
  }, [podId, page, statusFilter]);

  const loadPodDetails = async () => {
    try {
      const res = await getPodById(podId);
      setPod(res.data?.pod || null);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load pod details"
      );
    }
  };

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const res = await getPodInterviewReports(podId, params);
      setInterviews(res.data?.interviews || []);
      setStatistics(res.data?.statistics || {});
      setTotalPages(res.data?.pagination?.pages || 1);
      setTotalInterviews(res.data?.pagination?.total || 0);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load interview reports"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </span>
        );
      case "started":
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Abandoned
          </span>
        );
      default:
        return <span className="text-gray-600 text-xs">{status}</span>;
    }
  };

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
              size="sm"
              onClick={() => router.push("/dashboard/interview-reports")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Reports
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
              <FileText className="mr-3 h-8 w-8 text-vulcan-accent-blue" />
              {pod ? `${pod.name} - Interview Reports` : "Pod Interview Reports"}
            </h1>
            <p className="text-muted-foreground">
              {pod
                ? `Viewing interviews for ${pod.institutionName || pod.organizationName || pod.name}`
                : "Loading pod details..."}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Interviews
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalInterviews}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalUsers}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vulcan-accent-blue"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="started">Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setStatusFilter("");
                      setPage(1);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Reports</CardTitle>
              <CardDescription>
                Showing {interviews.length} of {totalInterviews} reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vulcan-accent-blue mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading reports...
                  </p>
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No interview reports found for this pod
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Job Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Started
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {interviews.map((interview) => (
                          <tr key={interview._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-vulcan-accent-blue text-white flex items-center justify-center font-semibold">
                                    {interview.userId.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {interview.userId.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {interview.userId.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {interview.jobRole || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(interview.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(interview.startedAt), "PPp")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {interview.completedAt
                                ? format(
                                    new Date(interview.completedAt),
                                    "PPp"
                                  )
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/interview-reports/${interview._id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                          variant="outline"
                          size="sm"
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

