/**
 * CloakSight — PII Patterns and Validators
 *
 * Deterministic regular expressions and mathematical checksum algorithms
 * for high-precision on-device PII detection.
 * Includes Indian government and enterprise identifiers (SIH 26171).
 */

import type { PIIType } from "../types/privacy";

// ============================================================
// Luhn Algorithm (Credit / Debit Card Checksum)
// ============================================================

/**
 * Validate a candidate credit/debit card number using the Luhn checksum formula.
 */
export function isValidLuhn(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/[\s-]/g, "");
  if (!/^\d{11,19}$/.test(sanitized)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// ============================================================
// Indian Aadhaar Validator
// ============================================================

/**
 * Verify structural rules for a 12-digit Indian Aadhaar number.
 * Disallows trivial repeating patterns like 0000 0000 0000 or 1111 1111 1111.
 */
export function isValidAadhaarStructure(aadhaar: string): boolean {
  const digits = aadhaar.replace(/[\s-]/g, "");
  if (!/^[2-9]\d{11}$/.test(digits)) {
    return false;
  }

  // Check for trivial repeating digits (e.g. 222222222222)
  const first = digits[0];
  if (digits.split("").every((d) => d === first)) {
    return false;
  }

  return true;
}

// ============================================================
// Core Regex Patterns
// ============================================================

export interface PatternRule {
  piiType: PIIType;
  regex: RegExp;
  confidence: number;
  validator?: (match: string) => boolean;
  contextRequired?: boolean;
}

export const PII_PATTERNS: PatternRule[] = [
  // 1. Email Address (RFC-compliant standard pattern)
  {
    piiType: "EMAIL",
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    confidence: 0.98,
  },

  // 2. Indian PAN (5 uppercase letters + 4 digits + 1 uppercase letter)
  {
    piiType: "PAN",
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    confidence: 0.98,
  },

  // 3. Indian Aadhaar Number (12 digits, often formatted as 4-4-4)
  {
    piiType: "AADHAAR",
    regex: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    confidence: 0.95,
    validator: isValidAadhaarStructure,
  },

  // 4. Credit / Debit Card Numbers (Validated with Luhn formula)
  {
    piiType: "CREDIT_CARD",
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5}\b/g,
    confidence: 0.98,
    validator: isValidLuhn,
  },

  // 5. Indian Phone Number (Mobile: 10 digits starting with 6-9, optional +91 or 0 prefix)
  {
    piiType: "PHONE",
    regex: /(?<!\d)(?:(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|0[6-9]\d{4}[\s-]?\d{5}\b)/g,
    confidence: 0.92,
  },

  // 6. Indian IFSC Code (4 letters + '0' + 6 alphanumeric characters)
  {
    piiType: "IFSC_CODE",
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    confidence: 0.96,
  },

  // 7. Indian Passport Number (1 letter + 7 digits)
  {
    piiType: "PASSPORT",
    regex: /\b[A-PR-WYa-pr-wy][1-9]\d{7}\b/g,
    confidence: 0.90,
  },

  // 8. Employee ID (e.g. EMP-1049, EID-58291, STAFF_9921)
  {
    piiType: "EMPLOYEE_ID",
    regex: /\b(?:EMP|EID|STAFF)[-_]?[0-9]{3,8}\b/gi,
    confidence: 0.94,
  },

  // 9. Financial Salary or Amount with currency symbol (₹, Rs, INR, $, €)
  {
    piiType: "SALARY",
    regex: /(?:₹|Rs\.?|INR|\$|€|£)\s?\d+(?:,\d{2,3})*(?:\.\d{1,2})?\b/gi,
    confidence: 0.90,
  },
];

// ============================================================
// Semantic Keywords for Contextual Field Inference
// ============================================================

export const CONTEXTUAL_PII_KEYWORDS: Record<string, PIIType> = {
  // Aadhaar
  aadhaar: "AADHAAR",
  aadhar: "AADHAAR",
  uidai: "AADHAAR",

  // PAN
  pan: "PAN",
  pancard: "PAN",
  "pan number": "PAN",
  "pan_no": "PAN",

  // Bank & IFSC
  "bank account": "BANK_ACCOUNT",
  "bank_account": "BANK_ACCOUNT",
  "bank-account": "BANK_ACCOUNT",
  "bank": "BANK_ACCOUNT",
  "account number": "BANK_ACCOUNT",
  "account_number": "BANK_ACCOUNT",
  "acc number": "BANK_ACCOUNT",
  "a/c no": "BANK_ACCOUNT",
  account_no: "BANK_ACCOUNT",
  ifsc: "IFSC_CODE",
  "ifsc code": "IFSC_CODE",
  "ifsc_code": "IFSC_CODE",
  "ifsc-code": "IFSC_CODE",

  // Name
  "employee name": "PERSON_NAME",
  "employee_name": "PERSON_NAME",
  "employee-name": "PERSON_NAME",
  "full name": "PERSON_NAME",
  "first name": "PERSON_NAME",
  "last name": "PERSON_NAME",
  beneficiary: "PERSON_NAME",
  "applicant name": "PERSON_NAME",

  // Contact
  email: "EMAIL",
  "email address": "EMAIL",
  phone: "PHONE",
  mobile: "PHONE",
  "phone number": "PHONE",
  "mobile number": "PHONE",

  // Cards
  "card number": "CREDIT_CARD",
  "credit card": "CREDIT_CARD",
  "debit card": "DEBIT_CARD",

  // Employee
  "employee id": "EMPLOYEE_ID",
  "emp id": "EMPLOYEE_ID",
  "staff id": "EMPLOYEE_ID",

  // Dates & Salary
  dob: "DATE_OF_BIRTH",
  "date of birth": "DATE_OF_BIRTH",
  birthdate: "DATE_OF_BIRTH",
  salary: "SALARY",
  ctc: "SALARY",
  "reimbursement amount": "AMOUNT",
  "expense amount": "AMOUNT",
  "claim amount": "AMOUNT",

  // Passport & ID
  passport: "PASSPORT",
  "passport number": "PASSPORT",
};
