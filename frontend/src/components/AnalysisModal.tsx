'use client';

import React from 'react';
import NextLink from 'next/link';
import { ChatAnalysisCard } from './ChatAnalysisCard';

interface CaseAnalysis {
  case_id: string;
  structured_facts?: any;
  legal_mapping?: any;
  action_plan?: any;
  generated_documents?: any;
  reasoning_trace?: any;
  agent_trace?: any;
}

interface AnalysisModalProps {
  analysis: CaseAnalysis;
  caseTitle: string;
  caseDomain: string;
}

export function AnalysisModal({ analysis, caseTitle, caseDomain }: AnalysisModalProps) {
  const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

  const metadata = {
    summary: analysis?.structured_facts?.incident_summary,
    standing: analysis?.legal_mapping?.legal_standing_score,
    actionPlan: analysis?.action_plan,
    legalMapping: analysis?.legal_mapping,
    generatedDocuments: analysis?.generated_documents,
    reasoningTrace: analysis?.reasoning_trace,
    incidentType: analysis?.structured_facts?.incident_type,
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
      <ChatAnalysisCard
        itemId={analysis?.case_id || 'modal-analysis'}
        metadata={metadata}
        backendUrl={BACKEND_URL}
      />

      {/* View Lawyer Button */}
      <div className="sticky bottom-0 pt-2 border-t border-[#e7d9c7] dark:border-[#cdaa80]/20 bg-white dark:bg-[#0a152e] pb-1">
        <NextLink
          href="/citizen/market_place"
          className="block w-full text-center px-4 py-3 rounded-lg bg-[#0f1e3f] text-[#cdaa80] font-semibold hover:bg-[#1a3358] transition"
        >
          View Cyber Lawyers →
        </NextLink>
      </div>
    </div>
  );
}
