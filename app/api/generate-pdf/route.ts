export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import React from "react";

// Inline PDF Document Component using React.createElement (no JSX)
const InterviewReportPDF = ({ reportDate, reportId, candidateName, candidateEmail, jobRole, allQuestionData, feedback, resumeAnalysis }: any) => {
  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
    title: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginBottom: 15, textAlign: 'center', color: '#666' },
    section: { marginBottom: 15 },
    heading: { fontSize: 16, marginBottom: 10, fontWeight: 'bold', color: '#2563eb' },
    text: { marginBottom: 5, lineHeight: 1.5 },
    bold: { fontWeight: 'bold' },
    infoGrid: { flexDirection: 'row', marginBottom: 20, padding: 15, backgroundColor: '#f3f4f6', borderRadius: 5 },
    infoItem: { flex: 1, marginRight: 15 },
    infoLabel: { fontSize: 10, color: '#666', marginBottom: 3 },
    infoValue: { fontSize: 12, fontWeight: 'bold' },
  });

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

  const questionsSection = allQuestionData && allQuestionData.length > 0 
    ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.heading }, 'Questions & Answers'),
        ...allQuestionData.map((q: any, i: number) => 
          React.createElement(View, { key: i, style: { marginBottom: 10 } },
            React.createElement(Text, { style: styles.bold }, `Q${i + 1}: ${q.question}`),
            React.createElement(Text, { style: styles.text }, `A: ${q.answer}`)
          )
        )
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
      React.createElement(Text, { style: styles.title }, 'Interview Feedback Report'),
      React.createElement(Text, { style: styles.subtitle }, 'Admin Dashboard Export'),
      
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.text }, `Report ID: ${reportId}`),
        React.createElement(Text, { style: styles.text }, `Date: ${reportDate}`)
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
    const { reportDate, reportId, candidateName, candidateEmail, jobRole, allQuestionData, feedback, resumeAnalysis } = data;

    const doc = React.createElement(InterviewReportPDF, {
      reportDate,
      reportId,
      candidateName,
      candidateEmail,
      jobRole,
      allQuestionData,
      feedback,
      resumeAnalysis,
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

