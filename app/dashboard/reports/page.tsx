"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllInterviewReports, getAllPods, deleteInterview, getInterviewById } from "@/components/api/adminApi";
import { toast } from "sonner";
import { Eye, Download, Calendar, User, Briefcase, CheckCircle, Search, Filter, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function ReportsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [podFilter, setPodFilter] = useState<string>("");
  const [pods, setPods] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInterviews, setSelectedInterviews] = useState<Set<string>>(new Set());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // Allow both super admin and regular admins to access reports
    // Super admin sees all, regular admin sees only their pod users' reports
    loadPods();
  }, []);

  useEffect(() => {
    loadReports();
  }, [page, statusFilter, podFilter, searchTerm]);

  const loadPods = async () => {
    try {
      const res = await getAllPods();
      setPods(res.data?.pods || []);
    } catch (error: any) {
      console.error("Error loading pods:", error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await getAllInterviewReports(
        page,
        50,
        statusFilter || undefined,
        podFilter || undefined,
        searchTerm || undefined
      );
      setInterviews(res.data?.interviews || []);
      setTotalPages(res.data?.pagination?.pages || 1);
      // Clear selections when data changes
      setSelectedInterviews(new Set());
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load reports");
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

  const filteredInterviews = interviews; // Filtering now done on backend

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const completedIds = filteredInterviews
        .filter((i) => i.status === "completed" && i.report?.metrics)
        .map((i) => i._id);
      setSelectedInterviews(new Set(completedIds));
    } else {
      setSelectedInterviews(new Set());
    }
  };

  const handleSelectInterview = (interviewId: string, checked: boolean) => {
    const newSelection = new Set(selectedInterviews);
    if (checked) {
      newSelection.add(interviewId);
    } else {
      newSelection.delete(interviewId);
    }
    setSelectedInterviews(newSelection);
  };

  const handleDownloadPDF = async (interviewId: string) => {
    try {
      const interview = interviews.find((i) => i._id === interviewId);
      if (!interview || !interview.report) {
        toast.error("Interview report not found");
        return;
      }

      // Fetch full interview details for PDF generation
      const { data } = await getInterviewById(interviewId);
      const fullInterview = data.interview;

      // Prepare feedback text
      const feedbackText = [
        fullInterview.report?.strengths && fullInterview.report.strengths.length > 0 
          ? `Strengths:\n${fullInterview.report.strengths.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` 
          : '',
        fullInterview.report?.improvements && fullInterview.report.improvements.length > 0 
          ? `Areas for Improvement:\n${fullInterview.report.improvements.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` 
          : '',
        fullInterview.report?.tips && fullInterview.report.tips.length > 0 
          ? `Tips:\n${fullInterview.report.tips.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}` 
          : '',
        fullInterview.report?.overallFeedback ? `\nOverall Feedback:\n${fullInterview.report.overallFeedback}` : '',
      ].filter(Boolean).join('\n\n') || 'No feedback available';

      // Prepare question data
      const questionData = (fullInterview.questionsData || []).map((q: any) => ({
        question: q.question || 'No question',
        answer: q.transcript || 'No answer provided',
      }));

      // Prepare resume analysis
      const resumeAnalysisText = fullInterview.metadata?.atsScore 
        ? `ATS Score: ${fullInterview.metadata.atsScore}/100\n\nImprovement Suggestions:\n${(fullInterview.metadata.resumeTips || []).map((tip: string, i: number) => `${i + 1}. ${tip}`).join('\n')}`
        : 'No resume analysis available';

      const reportId = `ADM-${new Date().getFullYear()}-${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

      const pdfData = {
        reportDate: new Date().toLocaleDateString(),
        reportId,
        candidateName: fullInterview.userId?.name || 'Unknown',
        candidateEmail: fullInterview.userId?.email || '',
        jobRole: fullInterview.jobRole || 'General Interview',
        allQuestionData: questionData,
        feedback: feedbackText,
        resumeAnalysis: resumeAnalysisText,
      };

      // Call admin API's generate-pdf endpoint
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pdfData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `Interview_Report_${interview.userId?.name?.replace(/\s+/g, '_')}_${interview.jobRole?.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadSelectedPDFs = async () => {
    if (selectedInterviews.size === 0) {
      toast.error("Please select at least one interview");
      return;
    }

    setIsGeneratingPDF(true);
    let successCount = 0;
    let failCount = 0;

    for (const interviewId of Array.from(selectedInterviews)) {
      try {
        await handleDownloadPDF(interviewId);
        successCount++;
        // Add delay between downloads to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
      }
    }

    setIsGeneratingPDF(false);
    
    if (successCount > 0) {
      toast.success(`Downloaded ${successCount} PDF(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to download ${failCount} PDF(s)`);
    }
  };

  // Both super admin and regular admins can access this page
  // The backend API will filter results based on admin permissions

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>All Interview Reports</CardTitle>
              <CardDescription>
                View all interview reports across all pods (Super Admin Only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="started">Started</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                  <select
                    value={podFilter}
                    onChange={(e) => {
                      setPodFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="">All Pods</option>
                    {pods
                      .filter((p) => !p.isDeleted)
                      .map((pod) => (
                        <option key={pod._id} value={pod._id}>
                          {pod.name}
                        </option>
                      ))}
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter("");
                      setPodFilter("");
                      setSearchTerm("");
                      setPage(1);
                    }}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>

                {/* Bulk Actions */}
                {selectedInterviews.size > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium">
                      {selectedInterviews.size} interview(s) selected
                    </span>
                    <Button
                      onClick={handleDownloadSelectedPDFs}
                      disabled={isGeneratingPDF}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGeneratingPDF ? "Downloading..." : "Download Selected PDFs"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedInterviews(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>

              {/* Reports List */}
              {loading ? (
                <div className="text-center py-8">Loading reports...</div>
              ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No interview reports found.
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    <input
                      type="checkbox"
                      checked={
                        selectedInterviews.size > 0 &&
                        selectedInterviews.size ===
                          filteredInterviews.filter(
                            (i) => i.status === "completed" && i.report?.metrics
                          ).length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">
                      Select All Completed Interviews
                    </span>
                  </div>

                  <div className="space-y-4">
                    {filteredInterviews.map((interview) => {
                      const canSelect = interview.status === "completed" && interview.report?.metrics;
                      const isSelected = selectedInterviews.has(interview._id);

                      return (
                        <div
                          key={interview._id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            {/* Checkbox */}
                            <div className="pt-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectInterview(interview._id, e.target.checked)}
                                disabled={!canSelect}
                                className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                                title={!canSelect ? "Only completed interviews can be selected" : "Select this interview"}
                              />
                            </div>

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
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(interview._id)}
                                disabled={!canSelect || isGeneratingPDF}
                                title={!canSelect ? "Download is only available for completed interviews" : "Download PDF report"}
                                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
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
                      );
                    })}
                  </div>
                </>
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
        </div>
      </main>
    </div>
  );
}

