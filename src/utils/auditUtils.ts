import { EventPlan, AuditReport } from '../types';

/**
 * Authoritative helper to get the latest audit report for an event.
 * Always resolves deterministically by sorting descending by timestamp.
 * Returns undefined if no audit reports exist.
 */
export function getLatestAuditReport(event?: EventPlan | null): AuditReport | undefined {
  if (!event || !Array.isArray(event.auditReports) || event.auditReports.length === 0) {
    return undefined;
  }

  // Filter out any invalid items
  const validReports = event.auditReports.filter((r) => r && typeof r === 'object');
  if (validReports.length === 0) return undefined;

  // Sort descending by timestamp; if equal or invalid, maintain stability
  const sorted = [...validReports].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });

  return sorted[0];
}
