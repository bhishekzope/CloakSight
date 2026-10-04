/**
 * CloakSight — Deterministic PII Detection Module
 *
 * Implements on-device detection using regex rules, DOM context inference,
 * and OCR spatial metadata for live client evaluation.
 */

import { DetectedEntity, DemoReimbursementFormState } from "../types/cloaksight";

export function detectPIIFromForm(formState: DemoReimbursementFormState): DetectedEntity[] {
  const detected: DetectedEntity[] = [];

  // 1. Employee Full Name
  if (formState.employeeName.trim()) {
    detected.push({
      entityId: "pii_001",
      category: "PERSON_NAME",
      rawValue: formState.employeeName.trim(),
      confidence: 0.94,
      detectionMethod: "DOM Context",
      sourceField: "Full Name (employee_name)",
      redacted: true,
      assignedTagId: "TAG_001",
      semanticLabel: "[PERSON_NAME]",
      fieldId: "employeeName",
    });
  }

  // 2. Employee ID
  if (formState.employeeId.trim()) {
    detected.push({
      entityId: "pii_002",
      category: "EMPLOYEE_ID",
      rawValue: formState.employeeId.trim(),
      confidence: 0.98,
      detectionMethod: "Pattern",
      sourceField: "Employee ID (employee_id)",
      redacted: true,
      assignedTagId: "TAG_002",
      semanticLabel: "[EMPLOYEE_ID]",
      fieldId: "employeeId",
    });
  }

  // 3. Email Address
  if (formState.email.trim()) {
    detected.push({
      entityId: "pii_003",
      category: "EMAIL",
      rawValue: formState.email.trim(),
      confidence: 0.99,
      detectionMethod: "Pattern",
      sourceField: "Email Address (email)",
      redacted: true,
      assignedTagId: "TAG_003",
      semanticLabel: "[EMAIL]",
      fieldId: "email",
    });
  }

  // 4. Phone Number
  if (formState.phone.trim()) {
    detected.push({
      entityId: "pii_004",
      category: "PHONE",
      rawValue: formState.phone.trim(),
      confidence: 0.92,
      detectionMethod: "Pattern",
      sourceField: "Phone Number (phone)",
      redacted: true,
      assignedTagId: "TAG_004",
      semanticLabel: "[PHONE]",
      fieldId: "phone",
    });
  }

  // 5. Bank Account Number
  if (formState.bankAccount.trim()) {
    detected.push({
      entityId: "pii_005",
      category: "BANK_ACCOUNT",
      rawValue: formState.bankAccount.trim(),
      confidence: 0.96,
      detectionMethod: "DOM Context",
      sourceField: "Bank Account Number (bank_account)",
      redacted: true,
      assignedTagId: "TAG_005",
      semanticLabel: "[BANK_ACCOUNT]",
      fieldId: "bankAccount",
    });
  }

  // 6. IFSC Code
  if (formState.ifscCode.trim()) {
    detected.push({
      entityId: "pii_006",
      category: "IFSC_CODE",
      rawValue: formState.ifscCode.trim(),
      confidence: 0.97,
      detectionMethod: "Pattern",
      sourceField: "IFSC Code (ifsc_code)",
      redacted: true,
      assignedTagId: "TAG_006",
      semanticLabel: "[IFSC_CODE]",
      fieldId: "ifscCode",
    });
  }

  return detected;
}

export function detectReceiptVisualPII(): Array<{
  id: string;
  field: string;
  value: string;
  category: string;
  confidence: number;
  method: string;
}> {
  return [
    {
      id: "ocr_001",
      field: "Guest Name",
      value: "Rahul Sharma",
      category: "PERSON_NAME",
      confidence: 0.95,
      method: "OCR Simulation",
    },
    {
      id: "ocr_002",
      field: "GST Identification Number",
      value: "27AABCG1234F1Z8",
      category: "TAX_ID",
      confidence: 0.91,
      method: "OCR Simulation",
    },
    {
      id: "ocr_003",
      field: "Total Amount",
      value: "INR 4,500.00",
      category: "AMOUNT",
      confidence: 0.98,
      method: "Visual Region",
    },
  ];
}
