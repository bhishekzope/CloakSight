/**
 * CloakSight — Action Planner & Risk Classifier
 *
 * Generates the deterministic structured action plan based on user task instructions.
 * Enforces risk levels (safe, sensitive, dangerous) and human-in-the-loop safety gating.
 */

import { StructuredAction } from "../types/cloaksight";

export const DEMO_TASK_DESCRIPTION = "Submit the hotel reimbursement for the selected trip (Hotel INR 4,500 on 2026-09-12).";

export function generateStructuredActionPlan(): StructuredAction[] {
  return [
    {
      actionId: "act_001",
      sequenceNumber: 1,
      type: "select",
      targetTag: "TAG_008",
      targetFieldName: "Expense Category",
      targetSelector: "#expense-category",
      permittedValue: "Hotel",
      description: 'Select "Hotel" from expense category dropdown.',
      riskLevel: "safe",
      requiresConfirmation: false,
      status: "pending",
    },
    {
      actionId: "act_002",
      sequenceNumber: 2,
      type: "fill",
      targetTag: "TAG_007",
      targetFieldName: "Travel Date",
      targetSelector: "#travel-date",
      permittedValue: "2026-09-12",
      description: 'Populate travel date with receipt date "2026-09-12".',
      riskLevel: "sensitive",
      requiresConfirmation: false,
      status: "pending",
    },
    {
      actionId: "act_003",
      sequenceNumber: 3,
      type: "fill",
      targetTag: "TAG_009",
      targetFieldName: "Amount (INR)",
      targetSelector: "#amount",
      permittedValue: "4500",
      description: 'Input claim amount "4500" matching receipt total.',
      riskLevel: "sensitive",
      requiresConfirmation: false,
      status: "pending",
    },
    {
      actionId: "act_004",
      sequenceNumber: 4,
      type: "fill",
      targetTag: "TAG_010",
      targetFieldName: "Description",
      targetSelector: "#description",
      permittedValue: "Hotel stay in Jalgaon for technical site audit (Receipt #JAL-2026-88).",
      description: "Attach audited trip summary description.",
      riskLevel: "safe",
      requiresConfirmation: false,
      status: "pending",
    },
    {
      actionId: "act_005",
      sequenceNumber: 5,
      type: "submit",
      targetTag: "TAG_011",
      targetFieldName: "Submit Reimbursement Button",
      targetSelector: "#btn-submit",
      description: "Dispatch final claim submission to corporate payroll endpoint.",
      riskLevel: "dangerous",
      requiresConfirmation: true, // Safety Gated!
      status: "pending",
    },
  ];
}
