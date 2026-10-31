/**
 * HUDDLE Proposals & Approval Log View
 * Complete audit trail of past proposals, approvals, rejections,
 * applied changes summaries, and pending proposals.
 * "Plan it. Perfect it. Save it."
 */

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { EventPlan, EventProposal, ApprovalRecord } from '../types';
import { formatCurrency } from '../services/storage';

interface ProposalsApprovalLogViewProps {
  event: EventPlan;
  onOpenProposalComparison: (proposal: EventProposal) => void;
}

export const ProposalsApprovalLogView: React.FC<ProposalsApprovalLogViewProps> = ({
  event,
  onOpenProposalComparison,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const currency = event.budget?.currency || 'INR';

  const proposals = event.proposals || [];
  const approvalHistory = event.approvalHistory || [];

  const pendingProposals = proposals.filter((p) => p.status === 'pending_review');

  const filteredHistory = approvalHistory.filter((record) => {
    if (filter === 'all') return true;
    if (filter === 'approved') return record.status === 'approved';
    if (filter === 'rejected') return record.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E2D8] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#3B1828] text-white">
              Governance & Audit Trail
            </span>
            <span className="text-xs text-[#78716C]">• Proposals & Approvals</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#3B1828]">Proposals & Change Approval Log</h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Compare proposed changes before applying, verify non-destructive updates, and inspect historical audit records.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8] text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'all' ? 'bg-[#3B1828] text-white shadow-xs' : 'text-stone-600 hover:text-[#3B1828]'
            }`}
          >
            All Logs ({approvalHistory.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'approved' ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-600 hover:text-emerald-800'
            }`}
          >
            Approved ({approvalHistory.filter((a) => a.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'rejected' ? 'bg-rose-800 text-white shadow-xs' : 'text-stone-600 hover:text-rose-800'
            }`}
          >
            Rejected ({approvalHistory.filter((a) => a.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Pending Proposals Section (If Any) */}
      {pendingProposals.length > 0 && (
        <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h3 className="font-serif font-bold text-sm text-amber-950">
                Pending Proposals Awaiting Review ({pendingProposals.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
              Action Required
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingProposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-[#3B1828]">
                      {prop.source.replace('_', ' ').toUpperCase()}
                    </span>
                    <h4 className="font-serif font-bold text-sm text-[#3B1828]">{prop.title}</h4>
                    {prop.isHypothetical && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-900">
                        Hypothetical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#57534E] line-clamp-1">{prop.summary}</p>
                  <span className="text-[10px] text-[#78716C] block">
                    Created: {new Date(prop.createdAt).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => onOpenProposalComparison(prop)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B1828] hover:bg-[#2A101C] text-white text-xs font-bold shrink-0 shadow-xs transition-all cursor-pointer"
                >
                  Review & Compare Changes →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Approvals & Rejections Log */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8E2D8] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
          <h3 className="font-serif font-bold text-base text-[#3B1828]">Historical Decisions & Applied Changes</h3>
          <span className="text-xs text-[#78716C]">
            {filteredHistory.length} record{filteredHistory.length === 1 ? '' : 's'} recorded in Firestore
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-[#78716C] space-y-2">
            <FileText className="w-8 h-8 mx-auto text-stone-300" />
            <p className="text-xs">No decision records found matching this filter.</p>
            <p className="text-[11px] text-stone-500">
              When you review and approve or reject Audit fixes, Rescue plans, or Simulator strategies, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((rec) => {
              const isApproved = rec.status === 'approved';
              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isApproved ? 'bg-[#FAF7F2]/60 border-[#E8E2D8]' : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  {/* Top row: Status, Title, Timestamp, Approver */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {isApproved ? (
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                          <XCircle className="w-4 h-4 text-rose-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              isApproved ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}
                          >
                            {rec.status}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                            {rec.proposalSource.replace('_', ' ').toUpperCase()}
                          </span>
                          <h4 className="font-serif font-bold text-sm text-[#3B1828]">{rec.proposalTitle}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#78716C] mt-0.5">
                          <span>{new Date(rec.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {rec.userName || 'Organizer'} {rec.userEmail ? `(${rec.userEmail})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Validation Snapshot Badges */}
                    {isApproved && rec.validationSnapshot && (
                      <div className="flex items-center gap-2 text-[10px] text-[#57534E]">
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E8E2D8] font-bold">
                          Budget: {rec.validationSnapshot.budgetDeltaFormatted}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E8E2D8] font-bold">
                          +{rec.validationSnapshot.newTasksCount} Tasks
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rejection reason if applicable */}
                  {!isApproved && rec.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 text-xs text-rose-900 border border-rose-200">
                      <strong>Reason:</strong> {rec.rejectionReason}
                    </div>
                  )}

                  {/* Applied changes summary */}
                  {isApproved && rec.appliedChangesSummary && rec.appliedChangesSummary.length > 0 && (
                    <div className="pt-2 border-t border-black/5 text-xs text-[#57534E]">
                      <span className="font-bold text-[10px] uppercase text-[#78716C] block mb-1">
                        Applied Changes Summary:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {rec.appliedChangesSummary.map((ch, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-emerald-900 bg-emerald-50/50 px-2 py-1 rounded-md text-[11px]">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{ch}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
