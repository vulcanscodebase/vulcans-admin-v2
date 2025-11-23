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
import { getInterviewDetails } from "@/components/api/adminApi";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  MessageSquare,
  TrendingUp,
  Target,
  Lightbulb,
  Award,
} from "lucide-react";
import { format } from "date-fns";

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin } = useAdminAuth();
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (interviewId) {
      loadInterviewDetails();
    }
  }, [interviewId]);

  const loadInterviewDetails = async () => {
    try {
      setLoading(true);
      const res = await getInterviewDetails(interviewId);
      setInterview(res.data?.interview || null);
      if (res.data?.interview?.questionsData?.length > 0) {
        setSelectedQuestion(0);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to load interview details"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-4 w-4" />
            Completed
          </span>
        );
      case "started":
      case "in_progress":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-4 w-4" />
            In Progress
          </span>
        );
      case "abandoned":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="mr-1 h-4 w-4" />
            Abandoned
          </span>
        );
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
          <AdminSidebar />
        </div>
        <main className="md:ml-64 pt-16 pb-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vulcan-accent-blue mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading interview details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
          <AdminSidebar />
        </div>
        <main className="md:ml-64 pt-16 pb-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Interview not found</p>
              <Button
                onClick={() => router.push("/dashboard/interview-reports")}
                className="mt-4"
              >
                Back to Reports
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const duration = interview.completedAt && interview.startedAt
    ? Math.round(
        (new Date(interview.completedAt).getTime() -
          new Date(interview.startedAt).getTime()) /
          1000 / 60
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNavbar />
      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
        <AdminSidebar />
      </div>

      <main className="md:ml-64 pt-16 pb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
                  <FileText className="mr-3 h-8 w-8 text-vulcan-accent-blue" />
                  Interview Report Details
                </h1>
                <p className="text-muted-foreground">
                  Interview ID: {interview._id}
                </p>
              </div>
              {getStatusBadge(interview.status)}
            </div>
          </div>

          {/* User and Interview Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-vulcan-accent-blue text-white flex items-center justify-center font-semibold text-lg mr-3">
                    {interview.userId?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {interview.userId?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {interview.userId?.email || "N/A"}
                    </p>
                  </div>
                </div>
                {interview.userId?.educationStatus && (
                  <div>
                    <span className="text-sm text-gray-500">Education Status:</span>
                    <p className="text-sm font-medium">{interview.userId.educationStatus}</p>
                  </div>
                )}
                {interview.userId?.profession && (
                  <div>
                    <span className="text-sm text-gray-500">Profession:</span>
                    <p className="text-sm font-medium">{interview.userId.profession}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                  Interview Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Job Role:</span>
                  <p className="font-medium">{interview.jobRole || "N/A"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Started:</span>
                  <p className="font-medium">
                    {format(new Date(interview.startedAt), "PPP 'at' p")}
                  </p>
                </div>
                {interview.completedAt && (
                  <>
                    <div>
                      <span className="text-sm text-gray-500">Completed:</span>
                      <p className="font-medium">
                        {format(new Date(interview.completedAt), "PPP 'at' p")}
                      </p>
                    </div>
                    {duration && (
                      <div>
                        <span className="text-sm text-gray-500">Duration:</span>
                        <p className="font-medium">{duration} minutes</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resume Information */}
          {interview.resume && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    File: {interview.resume.fileName || "resume.pdf"}
                  </p>
                  {interview.resume.text && (
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {interview.resume.text.substring(0, 500)}
                        {interview.resume.text.length > 500 && "..."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interview Report */}
          {interview.report && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                  Interview Feedback & Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Feedback */}
                {interview.report.overallFeedback && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center">
                      <MessageSquare className="mr-2 h-5 w-5 text-blue-600" />
                      Overall Feedback
                    </h3>
                    <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                      {interview.report.overallFeedback}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Strengths */}
                  {interview.report.strengths && interview.report.strengths.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-md mb-2 flex items-center text-green-700">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Strengths
                      </h3>
                      <ul className="space-y-2">
                        {interview.report.strengths.map((strength: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 bg-green-50 p-2 rounded"
                          >
                            • {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {interview.report.improvements && interview.report.improvements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-md mb-2 flex items-center text-yellow-700">
                        <Target className="mr-2 h-4 w-4" />
                        Improvements
                      </h3>
                      <ul className="space-y-2">
                        {interview.report.improvements.map((improvement: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 bg-yellow-50 p-2 rounded"
                          >
                            • {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {interview.report.tips && interview.report.tips.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-md mb-2 flex items-center text-purple-700">
                        <Lightbulb className="mr-2 h-4 w-4" />
                        Tips
                      </h3>
                      <ul className="space-y-2">
                        {interview.report.tips.map((tip: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 bg-purple-50 p-2 rounded"
                          >
                            • {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                {interview.report.metrics && (
                  <div>
                    <h3 className="font-semibold text-md mb-2">Performance Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(interview.report.metrics).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase">{key}</p>
                          <p className="text-xl font-bold text-gray-900">
                            {typeof value === "number" ? value.toFixed(1) : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Questions and Responses */}
          {interview.questionsData && interview.questionsData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-vulcan-accent-blue" />
                  Interview Questions & Responses
                </CardTitle>
                <CardDescription>
                  {interview.questionsData.length} questions answered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interview.questionsData.map((qData: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4 hover:border-vulcan-accent-blue transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-md text-gray-900">
                          Q{qData.questionNumber || idx + 1}: {qData.question}
                        </h4>
                      </div>
                      <div className="mt-3 bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-500 mb-1">Response:</p>
                        <p className="text-sm text-gray-700">
                          {qData.transcript || "No transcript available"}
                        </p>
                      </div>
                      {qData.metrics && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(qData.metrics).map(([key, value]: [string, any]) => (
                            <span
                              key={key}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {key}: {typeof value === "number" ? value.toFixed(1) : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

