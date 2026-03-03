export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, pdf, Image, renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { join } from "path";
import { readFileSync } from "fs";

// Inline PDF Document Component using React.createElement (no JSX)
const InterviewReportPDF = ({ 
  reportDate, 
  reportId, 
  downloadTimestamp,
  candidateName, 
  candidateEmail, 
  jobRole, 
  allQuestionData, 
  feedback, 
  resumeAnalysis,
  reportType = 'admin',
  performanceSummary = null,
  feedbackSections = null,
}: any) => {
  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
    header: { marginBottom: 15, alignItems: 'center' },
    logoContainer: { marginBottom: 8, alignItems: 'center' },
    logo: { width: 70, height: 70 },
    companyName: { fontSize: 26, fontWeight: 'bold', color: '#2563eb', marginTop: 8 },
    title: { fontSize: 22, marginBottom: 8, textAlign: 'center', fontWeight: 'bold' },
    subtitle: { fontSize: 12, marginBottom: 10, textAlign: 'center', color: '#666' },
    section: { marginBottom: 10 },
    heading: { fontSize: 14, marginBottom: 8, fontWeight: 'bold', color: '#2563eb' },
    text: { marginBottom: 3, lineHeight: 1.4 },
    bold: { fontWeight: 'bold', fontSize: 11 },
    infoGrid: { flexDirection: 'row', marginBottom: 15, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 5 },
    infoItem: { flex: 1, marginRight: 10 },
    infoLabel: { fontSize: 9, color: '#666', marginBottom: 2 },
    infoValue: { fontSize: 11, fontWeight: 'bold' },
    questionContainer: { marginBottom: 6, padding: 8, backgroundColor: '#f9fafb', borderRadius: 4 },
    metricsRow: { flexDirection: 'row', marginTop: 5, marginBottom: 5, flexWrap: 'wrap' },
    metricItem: { width: '18%', marginRight: '2%', padding: 4, backgroundColor: '#fff', borderRadius: 3 },
    metricLabel: { fontSize: 7, color: '#666', marginBottom: 1 },
    metricValue: { fontSize: 9, fontWeight: 'bold' },
    performanceSummaryBox: { marginBottom: 10, padding: 10, backgroundColor: '#eff6ff', borderRadius: 5, borderWidth: 1, borderColor: '#2563eb' },
    performanceSummaryRow: { flexDirection: 'row', marginTop: 3 },
    performanceSummaryLabel: { fontSize: 10, color: '#1e40af', marginRight: 8, fontWeight: 'bold' },
    performanceSummaryValue: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },
    feedbackBox: { marginTop: 5, padding: 6, backgroundColor: '#f3f4f6', borderRadius: 3 },
    feedbackSubHeading: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 5, marginTop: 8 },
    feedbackListItem: { marginBottom: 3, lineHeight: 1.4, fontSize: 10 },
    timestamp: { fontSize: 9, color: '#999', textAlign: 'center', marginTop: 5 },
  });

  // Try to load logo, fallback to text if not available
  let logoElement: any = null;
  try {
    const logoPath = join(process.cwd(), 'public', 'vulcans-logo.png');
    const logoData = readFileSync(logoPath);
    const logoBase64 = logoData.toString('base64');
    logoElement = React.createElement(Image, {
      src: `data:image/png;base64,${logoBase64}`,
      style: styles.logo,
    });
  } catch (error) {
    // Logo not found, will use text only
    console.log('Logo not found, using text only');
  }

  const headerSection = React.createElement(View, { style: styles.header },
    logoElement,
    React.createElement(Text, { style: styles.companyName }, 'VULCANS'),
    React.createElement(Text, { style: styles.title }, 'Interview Feedback Report'),
    React.createElement(Text, { style: styles.subtitle }, 
      reportType === 'admin' ? 'Admin Dashboard Export' : 'User Report Export'
    )
  );

  const candidateSection = React.createElement(View, { style: styles.infoGrid },
    React.createElement(View, { style: styles.infoItem },
      React.createElement(Text, { style: styles.infoLabel }, 'Candidate Name'),
      React.createElement(Text, { style: styles.infoValue }, candidateName || 'N/A')
    ),
    React.createElement(View, { style: styles.infoItem },
      React.createElement(Text, { style: styles.infoLabel }, 'Email'),
      React.createElement(Text, { style: styles.infoValue }, candidateEmail || 'N/A')
    ),
    React.createElement(View, { style: styles.infoItem },
      React.createElement(Text, { style: styles.infoLabel }, 'Job Role'),
      React.createElement(Text, { style: styles.infoValue }, jobRole || 'General Interview')
    )
  );

  const performanceSummarySection = performanceSummary
    ? React.createElement(View, { style: styles.performanceSummaryBox },
      React.createElement(Text, { style: styles.heading }, 'Performance Summary'),
      React.createElement(View, { style: styles.performanceSummaryRow },
        React.createElement(Text, { style: styles.performanceSummaryLabel }, 'Overall Score:'),
        React.createElement(Text, { style: styles.performanceSummaryValue }, `${performanceSummary.score}/${performanceSummary.outOf}`)
      ),
      React.createElement(View, { style: styles.performanceSummaryRow },
        React.createElement(Text, { style: styles.performanceSummaryLabel }, 'Percentage:'),
        React.createElement(Text, { style: styles.performanceSummaryValue }, `${performanceSummary.percentage}%`)
      ),
      React.createElement(View, { style: styles.performanceSummaryRow },
        React.createElement(Text, { style: styles.performanceSummaryLabel }, 'Grade:'),
        React.createElement(Text, { style: styles.performanceSummaryValue }, performanceSummary.grade || 'N/A')
      )
    )
    : null;

  const MAX_STARS = 10;
  const toTenStars = (val: number) => {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    return Math.min(10, Math.max(0, Math.round(val)));
  };

  // Enhanced questions section with metrics and feedback
  const questionsSection = allQuestionData && allQuestionData.length > 0 
    ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading }, 'Question-by-Question Analysis'),
        ...allQuestionData.map((q: any, i: number) => {
          const questionElements: any[] = [
            React.createElement(Text, { key: 'q-title', style: styles.bold, minPresenceAhead: 80 }, 
              `Question ${q.questionNumber || i + 1}: ${q.question}`
            ),
            React.createElement(Text, { key: 'q-answer', style: { ...styles.text, fontSize: 10 } }, 
              `Answer: ${q.answer || 'No answer provided'}`
            ),
          ];

          // Add metrics if available (display on 0-10 scale)
          if (q.metrics) {
            const metricsElements = [
              React.createElement(View, { key: 'metrics-row', style: styles.metricsRow },
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Confidence'),
                  React.createElement(Text, { style: styles.metricValue }, `${toTenStars(q.metrics.confidence || 0)}/${MAX_STARS}`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Body Language'),
                  React.createElement(Text, { style: styles.metricValue }, `${toTenStars(q.metrics.bodyLanguage || 0)}/${MAX_STARS}`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Knowledge'),
                  React.createElement(Text, { style: styles.metricValue }, `${toTenStars(q.metrics.knowledge || 0)}/${MAX_STARS}`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Fluency'),
                  React.createElement(Text, { style: styles.metricValue }, `${toTenStars(q.metrics.fluency || 0)}/${MAX_STARS}`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Skill Relevance'),
                  React.createElement(Text, { style: styles.metricValue }, `${toTenStars(q.metrics.skillRelevance || 0)}/${MAX_STARS}`)
                ),
              )
            ];
            questionElements.push(...metricsElements);

            // Add AI feedback if available
            if (q.metrics.feedback) {
              questionElements.push(
                React.createElement(View, { key: 'feedback-box', style: styles.feedbackBox },
                  React.createElement(Text, { style: { ...styles.text, fontSize: 9, fontWeight: 'bold' } }, 'AI Feedback:'),
                  React.createElement(Text, { style: { ...styles.text, fontSize: 9 } }, q.metrics.feedback)
                )
              );
            }
          }

          return React.createElement(View, { key: i, style: styles.questionContainer }, ...questionElements);
        })
      )
    : null;

  const resumeSection = resumeAnalysis
    ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading }, 'Resume Analysis'),
        React.createElement(Text, { style: styles.text }, resumeAnalysis)
      )
    : null;

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      headerSection,
      
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.text }, `Report ID: ${reportId}`),
        React.createElement(Text, { style: styles.text }, `Report Date: ${reportDate}`),
        downloadTimestamp && React.createElement(Text, { style: styles.timestamp }, 
          `Downloaded on: ${downloadTimestamp}`
        )
      ),

      candidateSection,

      performanceSummarySection,

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading }, 'Overall Feedback'),
        // Render Strengths, Areas for Improvement, Tips as separate styled sections
        ...(feedbackSections?.strengths && feedbackSections.strengths.length > 0
          ? [
            React.createElement(Text, { key: 'str-heading', style: styles.feedbackSubHeading }, 'Strengths:'),
            ...feedbackSections.strengths.map((s: string, i: number) =>
              React.createElement(Text, { key: `str-${i}`, style: styles.feedbackListItem }, `${i + 1}. ${s}`)
            ),
          ]
          : []),
        ...(feedbackSections?.improvements && feedbackSections.improvements.length > 0
          ? [
            React.createElement(Text, { key: 'imp-heading', style: styles.feedbackSubHeading }, 'Areas for Improvement:'),
            ...feedbackSections.improvements.map((s: string, i: number) =>
              React.createElement(Text, { key: `imp-${i}`, style: styles.feedbackListItem }, `${i + 1}. ${s}`)
            ),
          ]
          : []),
        ...(feedbackSections?.tips && feedbackSections.tips.length > 0
          ? [
            React.createElement(Text, { key: 'tips-heading', style: styles.feedbackSubHeading }, 'Tips:'),
            ...feedbackSections.tips.map((s: string, i: number) =>
              React.createElement(Text, { key: `tip-${i}`, style: styles.feedbackListItem }, `${i + 1}. ${s}`)
            ),
          ]
          : []),
        // Fallback: if no feedbackSections, show the plain feedback text
        ...(!feedbackSections || (!feedbackSections.strengths?.length && !feedbackSections.improvements?.length && !feedbackSections.tips?.length)
          ? [React.createElement(Text, { key: 'fb-text', style: styles.text }, feedback || 'No feedback available')]
          : []),
      ),

      questionsSection,
      resumeSection
    )
  );
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      reportDate, 
      reportId, 
      downloadTimestamp,
      candidateName, 
      candidateEmail, 
      jobRole, 
      allQuestionData, 
      feedback, 
      resumeAnalysis,
      reportType = 'admin'
    } = data;

    const doc = React.createElement(InterviewReportPDF, {
      reportDate,
      reportId,
      downloadTimestamp,
      candidateName,
      candidateEmail,
      jobRole,
      allQuestionData,
      feedback,
      resumeAnalysis,
      reportType,
      performanceSummary: data.performanceSummary ?? null,
      feedbackSections: data.feedbackSections ?? null,
    });

    const pdfBuffer = await renderToBuffer(doc);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Vulcan_Prep_Report.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
