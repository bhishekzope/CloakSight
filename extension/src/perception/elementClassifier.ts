/**
 * CloakSight — Element Classifier (Phase 7)
 *
 * Classifies DOM elements into semantic roles using multi-signal heuristics:
 *   - Accessible label & HTML attributes (name, id, type, autocomplete, placeholder)
 *   - Tag names and structural roles
 *   - Heuristic classification rules for enterprise and personal form fields
 *
 * PRIVACY: Element classifications remain inside the LOCAL TRUSTED ZONE.
 */

import type { ElementClassification, ElementClassificationLabel } from "../types/perception";
import type { DOMElement } from "../types/dom";
import { createLogger } from "../utils/logger";

const logger = createLogger("elementClassifier");

interface ClassificationRule {
  label: ElementClassificationLabel;
  isLikelySensitive: boolean;
  confidence: number;
  matcher: (el: DOMElement, combinedText: string) => boolean;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // 1. Submit / Cancel Buttons
  {
    label: "submit_button",
    isLikelySensitive: false,
    confidence: 0.95,
    matcher: (el, text) =>
      el.role === "button_submit" ||
      text.includes("submit") ||
      text.includes("claim") ||
      text.includes("send"),
  },
  {
    label: "cancel_button",
    isLikelySensitive: false,
    confidence: 0.92,
    matcher: (_el, text) =>
      text.includes("cancel") || text.includes("reset") || text.includes("clear"),
  },

  // 2. Identity & Government IDs
  {
    label: "aadhaar_field",
    isLikelySensitive: true,
    confidence: 0.96,
    matcher: (_el, text) => text.includes("aadhaar") || text.includes("uidai") || text.includes("aadhar"),
  },
  {
    label: "pan_field",
    isLikelySensitive: true,
    confidence: 0.95,
    matcher: (_el, text) => text.includes("pan") && (text.includes("number") || text.includes("card") || text.includes("pan_")),
  },
  {
    label: "employee_id_field",
    isLikelySensitive: true,
    confidence: 0.94,
    matcher: (_el, text) =>
      text.includes("employee id") ||
      text.includes("employee_id") ||
      text.includes("emp id") ||
      text.includes("emp_id") ||
      text.includes("staff id"),
  },

  // 3. Personal Contact Details
  {
    label: "email_field",
    isLikelySensitive: true,
    confidence: 0.96,
    matcher: (el, text) =>
      el.role === "input_email" ||
      el.attributes.type === "email" ||
      text.includes("email") ||
      text.includes("e-mail"),
  },
  {
    label: "phone_field",
    isLikelySensitive: true,
    confidence: 0.95,
    matcher: (el, text) =>
      el.role === "input_phone" ||
      el.attributes.type === "tel" ||
      text.includes("phone") ||
      text.includes("mobile") ||
      text.includes("contact number"),
  },
  {
    label: "employee_name_field",
    isLikelySensitive: true,
    confidence: 0.92,
    matcher: (_el, text) =>
      text.includes("full name") ||
      text.includes("employee name") ||
      text.includes("first name") ||
      text.includes("last name") ||
      text.includes("applicant name") ||
      (text.includes("name") && !text.includes("company") && !text.includes("hotel") && !text.includes("category")),
  },

  // 4. Financial & Banking
  {
    label: "bank_account_field",
    isLikelySensitive: true,
    confidence: 0.95,
    matcher: (_el, text) =>
      text.includes("bank account") ||
      text.includes("account number") ||
      text.includes("acc_no") ||
      text.includes("ifsc"),
  },
  {
    label: "credit_card_field",
    isLikelySensitive: true,
    confidence: 0.96,
    matcher: (_el, text) =>
      text.includes("card number") ||
      text.includes("credit card") ||
      text.includes("debit card") ||
      text.includes("cvv") ||
      text.includes("expiry"),
  },
  {
    label: "salary_field",
    isLikelySensitive: true,
    confidence: 0.90,
    matcher: (_el, text) =>
      text.includes("salary") || text.includes("ctc") || text.includes("compensation"),
  },
  {
    label: "amount_field",
    isLikelySensitive: false,
    confidence: 0.91,
    matcher: (el, text) =>
      (el.role === "input_number" || el.attributes.type === "number") &&
      (text.includes("amount") || text.includes("inr") || text.includes("price") || text.includes("cost")),
  },

  // 5. Form Structure & File Uploads
  {
    label: "file_upload_field",
    isLikelySensitive: true,
    confidence: 0.94,
    matcher: (el, text) =>
      el.role === "input_file" ||
      el.attributes.type === "file" ||
      text.includes("upload") ||
      text.includes("receipt") ||
      text.includes("attachment"),
  },
  {
    label: "date_field",
    isLikelySensitive: false,
    confidence: 0.90,
    matcher: (el, text) =>
      el.attributes.type === "date" ||
      text.includes("travel date") ||
      text.includes("expense date") ||
      text.includes("invoice date"),
  },
  {
    label: "date_of_birth_field",
    isLikelySensitive: true,
    confidence: 0.94,
    matcher: (_el, text) =>
      text.includes("birth") || text.includes("dob") || text.includes("date of birth"),
  },
  {
    label: "expense_category_field",
    isLikelySensitive: false,
    confidence: 0.92,
    matcher: (el, text) =>
      el.role === "select" ||
      el.tagName === "select" ||
      text.includes("expense category") ||
      text.includes("category") ||
      text.includes("expense type"),
  },
];

/**
 * Classify a single DOM element by semantic role and sensitivity likelihood.
 *
 * @param element Normalized DOMElement
 * @returns ElementClassification result
 */
export function classifyElement(element: DOMElement): ElementClassification {
  const accessibleLabel = (element.accessibleLabel || "").toLowerCase();
  const name = (element.attributes.name || "").toLowerCase();
  const id = (element.attributes.id || "").toLowerCase();
  const placeholder = (element.placeholder || "").toLowerCase();
  const autocomplete = (element.attributes.autocomplete || "").toLowerCase();
  const textContent = (element.textContent || "").toLowerCase();

  const combinedContext = [
    accessibleLabel,
    name,
    id,
    placeholder,
    autocomplete,
    textContent,
  ]
    .filter(Boolean)
    .join(" ");

  // Test against rule catalog
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.matcher(element, combinedContext)) {
      return {
        elementId: element.elementId,
        label: rule.label,
        confidence: rule.confidence,
        isLikelySensitive: rule.isLikelySensitive,
      };
    }
  }

  // Fallback classifications for standard elements
  if (element.role === "input_text" || element.role === "textarea") {
    return {
      elementId: element.elementId,
      label: "generic_text_field",
      confidence: 0.65,
      isLikelySensitive: false,
    };
  }

  if (element.isInteractive) {
    return {
      elementId: element.elementId,
      label: "non_sensitive_field",
      confidence: 0.70,
      isLikelySensitive: false,
    };
  }

  return {
    elementId: element.elementId,
    label: "unknown",
    confidence: 0.50,
    isLikelySensitive: false,
  };
}

/**
 * Classify all elements in a DOM snapshot in batch.
 *
 * @param elements Array of DOMElement objects
 * @returns Array of ElementClassification results
 */
export function classifyElements(
  elements: DOMElement[],
): ElementClassification[] {
  logger.debug("Starting batch element classification", { count: elements.length });
  const classifications = elements.map(classifyElement);
  const sensitiveCount = classifications.filter((c) => c.isLikelySensitive).length;

  logger.info("Batch element classification complete", {
    totalElements: elements.length,
    sensitiveElementsClassified: sensitiveCount,
  });

  return classifications;
}
