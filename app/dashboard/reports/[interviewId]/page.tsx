"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, User, Lightbulb, MessageSquare, Target, Star, CheckCircle, Calendar, Briefcase } from "lucide-react";
import { getInterviewById } from "@/components/api/adminApi";
import { toast } from "sonner";

interface Interview {
  _id: string;
  jobRole: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
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
      totalQuestions?: number;
    };
  };
  questionsData?: any[];
  metadata?: any;
}

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin } = useAdminAuth();
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (interviewId) {
      loadInterviewDetails();
    }
  }, [interviewId]);

  const loadInterviewDetails = async () => {
    try {
      setLoading(true);
      const res = await getInterviewById(interviewId);
      setInterview(res.data.interview);
    } catch (error: any) {
      console.error("Error loading interview:", error);
      toast.error(error.response?.data?.message || "Failed to load interview details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateOverallScore = (metrics?: any) => {
    if (!metrics) return 0;
    const {
      avgConfidence = 0,
      avgBodyLanguage = 0,
      avgKnowledge = 0,
      avgSkillRelevance = 0,
      avgFluency = 0,
    } = metrics;
    const total =
      avgConfidence + avgBodyLanguage + avgKnowledge + avgSkillRelevance + avgFluency;
    return Math.round((total / 25) * 100);
  };

  const StarRating = ({ value }: { value: number }) => {
    return (
      <div className="flex space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < value ? "text-blue-500 fill-blue-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        <div className="hidden md:block fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 border-r border-border overflow-y-auto z-40">
          <AdminSidebar />
        </div>
        <main className="md:ml-64 pt-16 pb-8">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
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
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">Interview not found</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        </main>
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
        <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Interview Report</h1>
                <p className="text-muted-foreground mt-1">
                  {interview.jobRole || "General Interview"}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                interview.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : interview.status === "in_progress"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : interview.status === "started"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              }`}
            >
              {interview.status}
            </span>
          </div>

          {/* User Info */}
          {interview.userId && (
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{interview.userId.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{interview.userId.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interview Date</p>
                    <p className="font-medium">{formatDate(interview.startedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interview Status Info for non-completed interviews or failed reports */}
          {interview.status !== "completed" || !interview.report?.metrics ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  {interview.status === "completed" && !interview.report ? (
                    // Completed but report generation failed
                    <>
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-semibold mb-3 text-red-900 dark:text-red-100">
                        Report Generation Failed
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        The interview was marked as completed, but the report could not be generated. This may be due to insufficient response data or a technical issue during the interview.
                      </p>
                      <span className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Status: Completed (No Report)
                      </span>
                    </>
                  ) : (
                    // In progress or started
                    <>
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-3">
                        Interview {interview.status === "started" ? "Started" : interview.status === "in_progress" ? "In Progress" : "Not Completed"}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {interview.status === "started" || interview.status === "in_progress"
                          ? "This interview is still in progress. The user needs to complete the interview to generate detailed feedback and metrics."
                          : "This interview has not been completed yet."}
                      </p>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                        interview.status === "started" || interview.status === "in_progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        Status: {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overall Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Performance</CardTitle>
                  <CardDescription>Summary of interview performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-6 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="text-4xl font-bold mb-2">
                        {calculateOverallScore(interview.report?.metrics)}%
                      </div>
                      <p className="text-muted-foreground">Overall Score</p>
                    </div>
                    <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="text-4xl font-bold mb-2">
                        {interview.report?.metrics?.totalQuestions || 0}
                      </div>
                      <p className="text-muted-foreground">Questions Answered</p>
                    </div>
                    <div className="text-center p-6 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="text-4xl font-bold mb-2">
                        {interview.status === "completed" ? "✓" : "○"}
                      </div>
                      <p className="text-muted-foreground">Status: {interview.status}</p>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      {
                        label: "Confidence",
                        value: Math.round(interview.report?.metrics?.avgConfidence || 0),
                        icon: <TrendingUp className="w-5 h-5" />,
                      },
                      {
                        label: "Body Language",
                        value: Math.round(interview.report?.metrics?.avgBodyLanguage || 0),
                        icon: <User className="w-5 h-5" />,
                      },
                      {
                        label: "Knowledge",
                        value: Math.round(interview.report?.metrics?.avgKnowledge || 0),
                        icon: <Lightbulb className="w-5 h-5" />,
                      },
                      {
                        label: "Fluency",
                        value: Math.round(interview.report?.metrics?.avgFluency || 0),
                        icon: <MessageSquare className="w-5 h-5" />,
                      },
                      {
                        label: "Skill Relevance",
                        value: Math.round(interview.report?.metrics?.avgSkillRelevance || 0),
                        icon: <Target className="w-5 h-5" />,
                      },
                    ].map((metric) => (
                      <div key={metric.label} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center space-x-2 mb-2">
                          {metric.icon}
                          <span className="text-sm font-medium">{metric.label}</span>
                        </div>
                        <StarRating value={metric.value} />
                        <p className="text-xs text-muted-foreground mt-1">{metric.value}/5</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Improvements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Strengths */}
                {interview.report?.strengths && interview.report.strengths.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {interview.report.strengths.map((strength, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
                          >
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                            <p className="text-sm">{strength}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Areas for Improvement */}
                {interview.report?.improvements && interview.report.improvements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        Areas to Improve
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {interview.report.improvements.map((improvement, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20"
                          >
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                            <p className="text-sm">{improvement}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Tips */}
              {interview.report?.tips && interview.report.tips.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      Interview Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {interview.report.tips.map((tip, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

