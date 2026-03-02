export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, pdf, Image } from "@react-pdf/renderer";
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
  reportType = 'admin'
}: any) => {
  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
    header: { marginBottom: 20, alignItems: 'center' },
    logoContainer: { marginBottom: 10, alignItems: 'center' },
    logo: { width: 80, height: 80 },
    companyName: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', marginTop: 10 },
    title: { fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginBottom: 15, textAlign: 'center', color: '#666' },
    section: { marginBottom: 15 },
    heading: { fontSize: 16, marginBottom: 10, fontWeight: 'bold', color: '#2563eb' },
    text: { marginBottom: 5, lineHeight: 1.5 },
    bold: { fontWeight: 'bold' },
    infoGrid: { flexDirection: 'row', marginBottom: 20, padding: 15, backgroundColor: '#f3f4f6', borderRadius: 5 },
    infoItem: { flex: 1, marginRight: 15 },
    infoLabel: { fontSize: 10, color: '#666', marginBottom: 3 },
    infoValue: { fontSize: 12, fontWeight: 'bold' },
    questionContainer: { marginBottom: 15, padding: 10, backgroundColor: '#f9fafb', borderRadius: 5 },
    metricsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8, flexWrap: 'wrap' },
    metricItem: { width: '18%', marginRight: '2%', padding: 5, backgroundColor: '#fff', borderRadius: 3 },
    metricLabel: { fontSize: 8, color: '#666', marginBottom: 2 },
    metricValue: { fontSize: 10, fontWeight: 'bold' },
    feedbackBox: { marginTop: 8, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 3 },
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

  // Enhanced questions section with metrics and feedback
  const questionsSection = allQuestionData && allQuestionData.length > 0 
    ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading }, 'Question-by-Question Analysis'),
        ...allQuestionData.map((q: any, i: number) => {
          const questionElements: any[] = [
            React.createElement(Text, { key: 'q-title', style: styles.bold }, 
              `Question ${q.questionNumber || i + 1}: ${q.question}`
            ),
            React.createElement(Text, { key: 'q-answer', style: styles.text }, 
              `Answer: ${q.answer || 'No answer provided'}`
            ),
          ];

          // Add metrics if available
          if (q.metrics) {
            const metricsElements = [
              React.createElement(View, { key: 'metrics-row', style: styles.metricsRow },
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Confidence'),
                  React.createElement(Text, { style: styles.metricValue }, `${Math.round(q.metrics.confidence || 0)}/5`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Body Language'),
                  React.createElement(Text, { style: styles.metricValue }, `${Math.round(q.metrics.bodyLanguage || 0)}/5`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Knowledge'),
                  React.createElement(Text, { style: styles.metricValue }, `${Math.round(q.metrics.knowledge || 0)}/5`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Fluency'),
                  React.createElement(Text, { style: styles.metricValue }, `${Math.round(q.metrics.fluency || 0)}/5`)
                ),
                React.createElement(View, { style: styles.metricItem },
                  React.createElement(Text, { style: styles.metricLabel }, 'Skill Relevance'),
                  React.createElement(Text, { style: styles.metricValue }, `${Math.round(q.metrics.skillRelevance || 0)}/5`)
                ),
              )
            ];
            questionElements.push(...metricsElements);

            // Add AI feedback if available
            if (q.metrics.feedback) {
              questionElements.push(
                React.createElement(View, { key: 'feedback-box', style: styles.feedbackBox },
                  React.createElement(Text, { style: { ...styles.text, fontSize: 10, fontWeight: 'bold' } }, 'AI Feedback:'),
                  React.createElement(Text, { style: styles.text }, q.metrics.feedback)
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

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading }, 'Overall Feedback'),
        React.createElement(Text, { style: styles.text }, feedback || 'No feedback available')
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
    });

    const pdfBuffer = await pdf(doc).toBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Interview_Feedback_Report.pdf",
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
