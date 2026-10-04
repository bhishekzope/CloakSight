/**
 * CloakSight — Synthetic Deterministic Enterprise Data
 *
 * Synthetic data values for client validation and zero-leakage demonstration.
 * Zero real personal or financial data is included.
 */

import { DemoReimbursementFormState, OrchestratorStage } from "../types/cloaksight";

export const FICTIONAL_EMPLOYEE_PROFILE = {
  employeeName: "Rahul Sharma",
  employeeId: "EMP-2024-0042",
  email: "rahul.sharma@corp.acme.in",
  phone: "+91 98765 43210",
  bankAccount: "00112345678901",
  ifscCode: "HDFC0001234",
};

export const FICTIONAL_TRIP_DETAILS = {
  expenseCategory: "Hotel",
  travelDate: "2026-09-12",
  amount: "4500",
  description: "Hotel stay in Jalgaon for technical site audit (Receipt #JAL-2026-88).",
};

export const INITIAL_FORM_STATE: DemoReimbursementFormState = {
  employeeName: "",
  employeeId: "",
  email: "",
  phone: "",
  bankAccount: "",
  ifscCode: "",
  expenseCategory: "",
  travelDate: "",
  amount: "",
  description: "",
  isSubmitted: false,
};

export const PIPELINE_STAGES = [
  {
    number: 1,
    title: "DOM Ingestion & Vision",
    shortName: "Perception",
    description: "Sub-15ms DOM element tree-walk and viewport region layout capture.",
    zone: "Local Trusted Zone",
    status: "active",
    iconName: "Eye",
  },
  {
    number: 2,
    title: "On-Device PII Detection",
    shortName: "Detection",
    description: "Deterministic pattern regexes, mathematical checksums, and contextual label inference.",
    zone: "Local Trusted Zone",
    status: "active",
    iconName: "ShieldAlert",
  },
  {
    number: 3,
    title: "Semantic Tagging & Vaulting",
    shortName: "Tag Vault",
    description: "Replaces raw secrets with opaque tags (TAG_001..006); original values isolated in RAM.",
    zone: "Local Trusted Zone",
    status: "active",
    iconName: "KeyRound",
  },
  {
    number: 4,
    title: "Context Sanitization",
    shortName: "Sanitization",
    description: "Filters non-interactive DOM; compresses payload by >80% for cloud AI consumption.",
    zone: "Local Trusted Zone",
    status: "active",
    iconName: "Layers",
  },
  {
    number: 5,
    title: "Outbound LeakGuard",
    shortName: "LeakGuard",
    description: "Airgap security inspection; multi-layer fail-closed scan for leaked PII patterns.",
    zone: "Airgap Boundary",
    status: "active",
    iconName: "ShieldCheck",
  },
  {
    number: 6,
    title: "AI Reasoning & Execution",
    shortName: "Execution",
    description: "AI reasons over tags; local action dispatcher re-hydrates real data and fills form.",
    zone: "AI & Execution Zone",
    status: "active",
    iconName: "Bot",
  },
];

export const ORCHESTRATOR_STAGES_INFO: Record<
  OrchestratorStage,
  { title: string; subtitle: string; description: string }
> = {
  1: {
    title: "Initialize Demo Data",
    subtitle: "Setting up demo sandbox",
    description: "Clears previous session memory, loads sample reimbursement portal inputs, and verifies local memory isolation.",
  },
  2: {
    title: "Inspect Reimbursement Form",
    subtitle: "DOM Tree Scanning",
    description: "Walking live form elements, capturing bounding rectangles, ARIA roles, and interactive input targets.",
  },
  3: {
    title: "Detect Configured PII",
    subtitle: "On-device pattern & context inspection",
    description: "Scanning employee inputs for Name, Employee ID, Email, Phone, Bank Account, and IFSC code.",
  },
  4: {
    title: "Create Semantic Tags",
    subtitle: "RAM Vault Isolation",
    description: "Assigning opaque tokens (TAG_001..TAG_006) and storing raw secrets in volatile memory with TTL.",
  },
  5: {
    title: "Prepare Sanitized Context",
    subtitle: "Context compression & structural abstraction",
    description: "Generating cloud-safe JSON payload where sensitive values are stripped and replaced with tags.",
  },
  6: {
    title: "Run Outbound LeakGuard",
    subtitle: "Pre-flight security inspection",
    description: "Scanning serialized payload against in-memory secret vault and regex patterns. Fails closed if any leak is detected.",
  },
  7: {
    title: "Display Sanitized AI Input",
    subtitle: "Cloud-safe context ready",
    description: "Displaying the exact sanitized JSON payload crossing the trust boundary to the AI model.",
  },
  8: {
    title: "Generate AI Action Plan",
    subtitle: "Structured agent planning",
    description: "AI reasons over opaque tags and issues a step-by-step action plan to fill travel details and submit claim.",
  },
  9: {
    title: "Require Safety Confirmation",
    subtitle: "Human-in-the-loop verification",
    description: "Pauses before executing dangerous final submission step, requiring human authorization.",
  },
  10: {
    title: "Execute Actions on Live Form",
    subtitle: "Local synthetic dispatch",
    description: "Dispatching DOM events (select Hotel, input Date, fill Amount) with simulated cadence on the visible form.",
  },
  11: {
    title: "Final Audit Summary",
    subtitle: "Zero-leak verification report",
    description: "Rendering successful submission card with privacy audit metrics confirming 0 bytes of raw PII left the device.",
  },
};

export const MOCK_RECEIPT_DETAILS = {
  hotelName: "Hotel Grand Palace",
  location: "Jalgaon, Maharashtra",
  receiptId: "JAL-2026-88",
  date: "12-Sep-2026",
  nights: "2 Nights (Room #304)",
  guestName: "Rahul Sharma",
  totalAmount: "INR 4,500.00",
  gstNumber: "27AABCG1234F1Z8",
};
