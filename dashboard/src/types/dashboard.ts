/**
 * CloakSight — Dashboard Component Types
 *
 * TypeScript interfaces for the developer dashboard.
 *
 * STATUS: Placeholder.
 * TODO(phase-9): Implement dashboard components.
 */

// ---- Session Summary ----
export interface SessionSummary {
  sessionId: string;
  pageUrl: string;
  startedAt: string;
  completedAt?: string;
  entitiesDetected: number;
  entitiesRedacted: number;
  redactionRatio: number;
  contextSizeChars: number;
  actionsExecuted: number;
  status: "active" | "complete" | "error" | "blocked";
}

// ---- Privacy Metrics ----
export interface PrivacyMetrics {
  totalSessions: number;
  totalEntitiesRedacted: number;
  averageRedactionRatio: number;
  leakGuardBlocks: number;
  piiTypeBreakdown: Record<string, number>;
}

// ---- Dashboard State ----
export interface DashboardState {
  currentSession?: SessionSummary;
  recentSessions: SessionSummary[];
  metrics: PrivacyMetrics;
  isConnected: boolean;
}
