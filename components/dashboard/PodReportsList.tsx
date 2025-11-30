"use client";

import { useState, useEffect } from "react";
import { getPodInterviewReports, getInterviewById, deleteInterview } from "@/components/api/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, Download, Calendar, User, Briefcase, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PodReportsListProps {
  podId: string;
}

interface Interview {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  jobRole: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  report?: {
    strengths?: string[];
    improvements?: string[];
    tips?: string[];
    overallFeedback?: string;
    metrics?: {
      avgConfidence?: number;
      avgBodyLanguage?: number;
      avgKnowledge?: number;
      avgSkillRelevance?: number;
      avgFluency?: number;
    };
  };
}

export default function PodReportsList({ podId }: PodReportsListProps) {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    loadReports();
  }, [podId, page, statusFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await getPodInterviewReports(podId, page, 50, statusFilter || undefined);
      console.log("Pod reports response:", res.data); // Debug log
      const interviews = res.data?.interviews || [];
      console.log("Interviews found:", interviews.length); // Debug log
      setInterviews(interviews);
      setTotalPages(res.data?.pagination?.pages || 1);
    } catch (error: any) {
      console.error("Error loading pod reports:", error); // Debug log
      const errorMessage = error.response?.data?.message || error.message || "Failed to load reports";
      toast.error(errorMessage);
      setInterviews([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "started":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "abandoned":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleViewDetails = (interviewId: string) => {
    router.push(`/dashboard/reports/${interviewId}`);
  };

  const handleDeleteInterview = async (interviewId: string, jobRole: string) => {
    if (!confirm(`Are you sure you want to delete this interview for "${jobRole}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteInterview(interviewId);
      toast.success("Interview deleted successfully!");
      loadReports();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete interview");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">Loading reports...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Reports</CardTitle>
        <CardDescription>View all interview reports for this pod</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="started">Started</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        {/* Reports List */}
        {interviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No interview reports found for this pod.
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview._id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {interview.jobRole || "General Interview"}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          interview.status
                        )}`}
                      >
                        {interview.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {interview.userId?.name || interview.userId?.email || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(interview.startedAt)}</span>
                      </div>
                      {interview.completedAt && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Completed: {formatDate(interview.completedAt)}</span>
                        </div>
                      )}
                      {interview.report?.metrics && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>
                            Score:{" "}
                            {Math.round(
                              ((interview.report.metrics.avgConfidence || 0) +
                                (interview.report.metrics.avgBodyLanguage || 0) +
                                (interview.report.metrics.avgKnowledge || 0) +
                                (interview.report.metrics.avgSkillRelevance || 0) +
                                (interview.report.metrics.avgFluency || 0)) /
                                5
                            )}
                            /100
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(interview._id)}
                      disabled={interview.status !== "completed"}
                      title={interview.status !== "completed" ? "View is only available for completed interviews" : "View interview details"}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInterview(interview._id, interview.jobRole || "General Interview")}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

