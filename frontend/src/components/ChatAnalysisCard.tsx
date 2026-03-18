'use client';

import React, { useMemo, useState } from 'react';
import NextLink from 'next/link';

type AnalysisMetadata = {
  summary?: string;
  standing?: string;
  actionPlan?: any;
  legalMapping?: any;
  generatedDocuments?: any;
  reasoningTrace?: any;
  incidentType?: string;
};

type ChatAnalysisCardProps = {
  itemId: string;
  metadata: AnalysisMetadata;
  backendUrl: string;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  onDownloadSync?: () => void;
};

export function ChatAnalysisCard({
  itemId,
  metadata,
  backendUrl,
  expanded,
  onToggleExpanded,
  onDownloadSync,
}: ChatAnalysisCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isExpanded = expanded ?? internalExpanded;
  const toggleExpanded = onToggleExpanded ?? (() => setInternalExpanded((prev) => !prev));

  const standing = (metadata.standing || 'weak').toLowerCase();

  const normalizedActionPlan = useMemo(() => {
    const actionPlan = metadata.actionPlan || {};
    const immediate = actionPlan.immediate || actionPlan.immediate_actions || [];
    const mediumTerm = actionPlan.medium_term || actionPlan.medium_term_actions || [];

    const normalizeStep = (step: any) => {
      if (typeof step === 'string') {
        return { step, description: '', priority: 'medium', deadline: '' };
      }
      return {
        step: step?.step || step?.action || 'Untitled step',
        description: step?.description || '',
        priority: (step?.priority || 'medium').toLowerCase(),
        deadline: step?.deadline || '',
      };
    };

    return {
      ...actionPlan,
      immediate: immediate.map(normalizeStep),
      medium_term: mediumTerm.map(normalizeStep),
      forum_selection: actionPlan.forum_selection || 'N/A',
      timeline_estimate: actionPlan.timeline_estimate || 'N/A',
      cost_estimate: actionPlan.cost_estimate || 'N/A',
      lawyer_recommended: !!actionPlan.lawyer_recommended,
      evidence_checklist: actionPlan.evidence_checklist || [],
    };
  }, [metadata.actionPlan]);

  const normalizedLegalSections = useMemo(() => {
    const sections = metadata.legalMapping?.applicable_sections || [];
    return sections.map((section: any) => ({
      section_ref: section?.section_ref || section?.section || 'Section',
      confidence: (section?.confidence || 'medium').toLowerCase(),
      description: section?.description || section?.text || '',
    }));
  }, [metadata.legalMapping]);

  return (
    <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-[#997953]/10 to-transparent dark:from-[#cdaa80]/10 dark:to-transparent border border-[#997953]/20 dark:border-[#cdaa80]/20 shadow-inner">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] uppercase tracking-[2px] font-bold text-[#997953] dark:text-[#cdaa80]">Legal Perspective</span>
        <span
          className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
            standing === 'strong'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
              : standing === 'moderate'
                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
          }`}
        >
          {standing} Standing
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-[13px] font-semibold text-gray-500 dark:text-white/40 mb-1">Case Summary</h4>
          <p className="text-[14px] text-gray-700 dark:text-white/80 leading-relaxed italic line-clamp-3">
            &quot;{metadata.summary || 'No summary available'}&quot;
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={toggleExpanded}
            className="text-[13px] font-medium text-[#997953] dark:text-[#cdaa80] hover:underline underline-offset-4 flex items-center gap-1 group cursor-pointer"
          >
            {isExpanded ? 'Collapse Details' : 'View Full Action Plan'}
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-1'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-6 border-t border-[#997953]/10 dark:border-[#cdaa80]/10 pt-6 animate-message">
            {metadata.actionPlan && (
              <div>
                <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">Action Plan</h4>

                {normalizedActionPlan.immediate?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-red-500 dark:text-red-400 mb-2 block">⚡ Immediate Steps</span>
                    <div className="space-y-2">
                      {normalizedActionPlan.immediate.map((step: any, i: number) => (
                        <div key={`${itemId}-immediate-${i}`} className="p-3 rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[14px] font-medium text-gray-800 dark:text-white">{step.step}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold uppercase ${
                                step.priority === 'high'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                              }`}
                            >
                              {step.priority}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-600 dark:text-white/60 mt-1">{step.description}</p>
                          <span className="text-[11px] text-gray-400 dark:text-white/30 mt-1 block">⏱ {step.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {normalizedActionPlan.medium_term?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-500 dark:text-blue-400 mb-2 block">📋 Medium-Term Steps</span>
                    <div className="space-y-2">
                      {normalizedActionPlan.medium_term.map((step: any, i: number) => (
                        <div key={`${itemId}-medium-${i}`} className="p-3 rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5">
                          <span className="text-[14px] font-medium text-gray-800 dark:text-white">{step.step}</span>
                          <p className="text-[13px] text-gray-600 dark:text-white/60 mt-1">{step.description}</p>
                          <span className="text-[11px] text-gray-400 dark:text-white/30 mt-1 block">⏱ {step.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Forum</span>
                    <span className="text-[12px] font-medium text-gray-800 dark:text-white mt-1 block">{normalizedActionPlan.forum_selection}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Timeline</span>
                    <span className="text-[12px] font-medium text-gray-800 dark:text-white mt-1 block">{normalizedActionPlan.timeline_estimate}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Est. Cost</span>
                    <span className="text-[12px] font-medium text-gray-800 dark:text-white mt-1 block">{normalizedActionPlan.cost_estimate}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/30 block">Lawyer</span>
                    <span className={`text-[12px] font-medium mt-1 block ${normalizedActionPlan.lawyer_recommended ? 'text-red-500' : 'text-green-500'}`}>
                      {normalizedActionPlan.lawyer_recommended ? 'Recommended' : 'Not Required'}
                    </span>
                    {normalizedActionPlan.lawyer_recommended && (
                      <NextLink
                        href={`/citizen/market_place?type=${metadata?.incidentType || 'other'}`}
                        className="mt-2 text-[10px] font-semibold text-[#997953] dark:text-[#cdaa80] border border-[#997953]/30 dark:border-[#cdaa80]/30 px-2 py-1 rounded-md hover:bg-[#997953]/10 dark:hover:bg-[#cdaa80]/10 transition-colors inline-block"
                      >
                        View {metadata?.incidentType?.replace('_', ' ') || ''} Lawyers
                      </NextLink>
                    )}
                  </div>
                </div>

                {normalizedActionPlan.evidence_checklist?.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 dark:text-white/40 mb-2 block">📎 Evidence Checklist</span>
                    <ul className="space-y-1">
                      {normalizedActionPlan.evidence_checklist.map((item: string, i: number) => (
                        <li key={`${itemId}-evidence-${i}`} className="text-[13px] text-gray-600 dark:text-white/60 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#cdaa80] shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {normalizedLegalSections?.length > 0 && (
              <div>
                <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">Applicable Legal Sections</h4>
                <div className="space-y-2">
                  {normalizedLegalSections.map((section: any, i: number) => (
                    <details key={`${itemId}-legal-${i}`} className="group rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5 overflow-hidden">
                      <summary className="p-3 cursor-pointer flex items-center justify-between text-[13px] font-medium text-gray-800 dark:text-white hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                        <span>📜 {section.section_ref}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            section.confidence === 'high'
                              ? 'bg-green-500/10 text-green-600'
                              : section.confidence === 'medium'
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-red-500/10 text-red-600'
                          }`}
                        >
                          {section.confidence}
                        </span>
                      </summary>
                      <div className="px-3 pb-3 text-[12px] text-gray-600 dark:text-white/50 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-2">
                        {section.description?.substring(0, 300)}{section.description?.length > 300 ? '...' : ''}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {metadata.generatedDocuments && (
              <div>
                <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">Generated Documents</h4>
                <div className="space-y-3">
                  {Object.entries(metadata.generatedDocuments).map(([key, doc]: [string, any]) => {
                    if (!doc || !doc.content_md) return null;
                    const pdfName = doc.pdf_url?.split(/[\\/]/).pop();
                    const docxName = doc.docx_url?.split(/[\\/]/).pop();

                    return (
                      <details key={`${itemId}-doc-${key}`} className="group rounded-lg bg-white/50 dark:bg-[#0f1e3f]/50 border border-gray-200/50 dark:border-white/5 overflow-hidden">
                        <summary className="p-3 cursor-pointer flex items-center justify-between text-[13px] font-medium text-gray-800 dark:text-white hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                          <span>📄 {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                          <div className="flex items-center gap-2">
                            {pdfName && (
                              <a
                                href={`${backendUrl}/download/${pdfName}`}
                                download
                                className="text-[10px] px-2 py-1 rounded bg-[#997953]/10 dark:bg-[#cdaa80]/10 text-[#997953] dark:text-[#cdaa80] font-bold uppercase hover:bg-[#997953]/20 dark:hover:bg-[#cdaa80]/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDownloadSync?.();
                                }}
                              >
                                PDF ↓
                              </a>
                            )}
                            {docxName && (
                              <a
                                href={`${backendUrl}/download/${docxName}`}
                                download
                                className="text-[10px] px-2 py-1 rounded bg-[#997953]/10 dark:bg-[#cdaa80]/10 text-[#997953] dark:text-[#cdaa80] font-bold uppercase hover:bg-[#997953]/20 dark:hover:bg-[#cdaa80]/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDownloadSync?.();
                                }}
                              >
                                DOCX ↓
                              </a>
                            )}
                          </div>
                        </summary>
                        <div className="px-4 pb-4 text-[12px] text-gray-700 dark:text-white/70 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3 whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto custom-scrollbar">
                          {doc.content_md}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}

            {metadata.reasoningTrace && (
              <div>
                <h4 className="text-[12px] uppercase tracking-[1.5px] font-bold text-[#997953] dark:text-[#cdaa80] mb-3">AI Reasoning</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase ${
                        metadata.reasoningTrace.overall_confidence === 'high'
                          ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                          : metadata.reasoningTrace.overall_confidence === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}
                    >
                      Confidence: {metadata.reasoningTrace.overall_confidence}
                    </span>
                  </div>
                  {metadata.reasoningTrace.legal_standing_breakdown && (
                    <p className="text-[13px] text-gray-600 dark:text-white/60 leading-relaxed">
                      {metadata.reasoningTrace.legal_standing_breakdown}
                    </p>
                  )}
                  {metadata.reasoningTrace.agent_logs?.length > 0 && (
                    <details className="rounded-lg bg-white/30 dark:bg-[#0f1e3f]/30 border border-gray-200/30 dark:border-white/5">
                      <summary className="p-2 cursor-pointer text-[11px] font-medium text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60">
                        Agent Activity Log ({metadata.reasoningTrace.agent_logs.length} entries)
                      </summary>
                      <div className="px-3 pb-3 space-y-1">
                        {metadata.reasoningTrace.agent_logs.map((log: string, i: number) => (
                          <p key={`${itemId}-log-${i}`} className="text-[11px] text-gray-500 dark:text-white/40 font-mono">{log}</p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
