/**
 * CloakSight — Sanitized Context Builder
 *
 * Assembles the cloud-safe JSON payload. Strips raw values from sensitive
 * elements and replaces them with opaque semantic tags.
 * Supports intentional mock tainting to demonstrate fail-closed LeakGuard defense.
 */

import {
  SanitizedPayload,
  SanitizedElement,
  DetectedEntity,
  SemanticTag,
  DemoReimbursementFormState,
} from "../types/cloaksight";

export function buildSanitizedContext(
  formState: DemoReimbursementFormState,
  entities: DetectedEntity[],
  tags: SemanticTag[],
  isTaintedForDemo = false,
  taintedSecret = "rahul.sharma@corp.acme.in"
): SanitizedPayload {
  const tagMap = new Map(tags.map((t) => [t.sourceField, t]));

  // Build structural elements list
  const elements: SanitizedElement[] = [
    // Section 1: Employee Information (Sensitive)
    {
      tagId: tagMap.get("Full Name (employee_name)")?.tagId || "TAG_001",
      elementType: "input",
      elementRole: "input_text",
      semanticLabel: "[PERSON_NAME]",
      isSensitive: true,
      isInteractive: true,
      safeValue: undefined, // Stripped!
      selector: "#employee-name",
    },
    {
      tagId: tagMap.get("Employee ID (employee_id)")?.tagId || "TAG_002",
      elementType: "input",
      elementRole: "input_text",
      semanticLabel: "[EMPLOYEE_ID]",
      isSensitive: true,
      isInteractive: true,
      safeValue: undefined,
      selector: "#employee-id",
    },
    {
      tagId: tagMap.get("Email Address (email)")?.tagId || "TAG_003",
      elementType: "input",
      elementRole: "input_email",
      semanticLabel: isTaintedForDemo ? taintedSecret : "[EMAIL]",
      isSensitive: true,
      isInteractive: true,
      safeValue: isTaintedForDemo ? taintedSecret : undefined, // Tainted leak simulation!
      selector: "#email",
    },
    {
      tagId: tagMap.get("Phone Number (phone)")?.tagId || "TAG_004",
      elementType: "input",
      elementRole: "input_phone",
      semanticLabel: "[PHONE]",
      isSensitive: true,
      isInteractive: true,
      safeValue: undefined,
      selector: "#phone",
    },

    // Section 2: Banking Details (Sensitive)
    {
      tagId: tagMap.get("Bank Account Number (bank_account)")?.tagId || "TAG_005",
      elementType: "input",
      elementRole: "input_text",
      semanticLabel: "[BANK_ACCOUNT]",
      isSensitive: true,
      isInteractive: true,
      safeValue: undefined,
      selector: "#bank-account",
    },
    {
      tagId: tagMap.get("IFSC Code (ifsc_code)")?.tagId || "TAG_006",
      elementType: "input",
      elementRole: "input_text",
      semanticLabel: "[IFSC_CODE]",
      isSensitive: true,
      isInteractive: true,
      safeValue: undefined,
      selector: "#ifsc-code",
    },

    // Section 3: Travel Information (Non-sensitive / Action Targets)
    {
      tagId: "TAG_007",
      elementType: "input",
      elementRole: "input_date",
      semanticLabel: "Travel Date *",
      isSensitive: false,
      isInteractive: true,
      safeValue: formState.travelDate || undefined,
      selector: "#travel-date",
    },
    {
      tagId: "TAG_008",
      elementType: "select",
      elementRole: "select",
      semanticLabel: "Expense Category *",
      isSensitive: false,
      isInteractive: true,
      safeValue: formState.expenseCategory || undefined,
      selector: "#expense-category",
    },
    {
      tagId: "TAG_009",
      elementType: "input",
      elementRole: "input_number",
      semanticLabel: "Amount (INR) *",
      isSensitive: false,
      isInteractive: true,
      safeValue: formState.amount || undefined,
      selector: "#amount",
    },
    {
      tagId: "TAG_010",
      elementType: "textarea",
      elementRole: "textarea",
      semanticLabel: "Description",
      isSensitive: false,
      isInteractive: true,
      safeValue: formState.description || undefined,
      selector: "#description",
    },

    // Section 4: Action Buttons
    {
      tagId: "TAG_011",
      elementType: "button",
      elementRole: "button_submit",
      semanticLabel: "Submit Reimbursement",
      isSensitive: false,
      isInteractive: true,
      selector: "#btn-submit",
    },
  ];

  const sensitiveCount = elements.filter((e) => e.isSensitive).length;
  const redactionRatio = Number((sensitiveCount / elements.length).toFixed(3));

  return {
    sessionId: `session_${Date.now()}`,
    pageMetadata: {
      title: "ACME Corp — Enterprise Reimbursement Portal",
      url: "https://portal.internal.acme.in/claims/travel",
      elementCount: elements.length,
      sensitiveCount,
      interactiveCount: elements.filter((e) => e.isInteractive).length,
      redactionRatio,
    },
    elements,
    availableActions: [
      "SELECT_OPTION (TAG_008: Expense Category)",
      "FILL_INPUT (TAG_007: Travel Date)",
      "FILL_INPUT (TAG_009: Amount)",
      "FILL_INPUT (TAG_010: Description)",
      "CLICK_SUBMIT (TAG_011: Submit Reimbursement)",
    ],
    builtAt: new Date().toISOString(),
    isTaintedForDemo,
    taintedSecretValue: isTaintedForDemo ? taintedSecret : undefined,
  };
}
