// @vitest-environment jsdom
/**
 * CloakSight — Phase 15: Demo Reimbursement Portal End-to-End Integration Tests
 *
 * Validates the complete autonomous browser perception and action execution loop:
 *   1. Live DOM Ingestion (DOM tree, attributes, accessible roles)
 *   2. On-Device PII Detection (6 PII fields: Name, Emp ID, Email, Phone, Bank, IFSC)
 *   3. Semantic Tagging & In-Memory RAM TagVault Storage
 *   4. Sanitized Context & Agent Request Construction
 *   5. Outbound Leak Guard Inspection (Zero raw PII leaves the browser)
 *   6. Agent Client Reasoning (Ollama / Mock Provider)
 *   7. Action Plan Normalization, Optimization & Safety Gating
 *   8. Local Action Re-hydration & DOM Synthetic Event Dispatch
 *   9. Form Submission & Post-Submission Privacy Audit Verification
 */

import { describe, it, expect, beforeEach } from "vitest";
import { runFullAutonomousTask, runLocalRedaction } from "../../src/content/content";
import { clearRegistry } from "../../src/action/elementRegistry";
import { clearSession, getAllSessionTags } from "../../src/storage/tagVault";
import { checkForLeaks } from "../../src/privacy/leakGuard";
import { buildAgentRequest } from "../../src/context/contextBuilder";

describe("Phase 15: Demo Reimbursement Portal Integration (End-to-End)", () => {
  let form: HTMLFormElement;
  let submissionCard: HTMLDivElement;

  beforeEach(() => {
    clearRegistry();
    clearSession();

    // Setup the exact ACME Corp reimbursement portal DOM
    document.body.innerHTML = `
      <div class="portal-container">
        <form id="reimbursement-form" class="portal-form">
          <!-- Section 1: Employee PII -->
          <label for="employee-name">Full Name *</label>
          <input type="text" id="employee-name" name="employee_name" value="Rahul Sharma" placeholder="e.g. Rahul Sharma" required />

          <label for="employee-id">Employee ID *</label>
          <input type="text" id="employee-id" name="employee_id" value="EMP-2024-0042" placeholder="e.g. EMP-2024-0042" required />

          <label for="email">Email Address *</label>
          <input type="email" id="email" name="email" value="rahul@company.com" placeholder="rahul@company.com" required />

          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone" value="+91 98765 43210" placeholder="+91 98765 43210" />

          <!-- Section 2: Banking PII -->
          <label for="bank-account">Bank Account Number *</label>
          <input type="text" id="bank-account" name="bank_account" value="00112345678901" placeholder="e.g. 00112345678901" required />

          <label for="ifsc-code">IFSC Code *</label>
          <input type="text" id="ifsc-code" name="ifsc_code" value="HDFC0001234" placeholder="e.g. HDFC0001234" required />

          <!-- Section 3: Travel Expense Details (empty initially) -->
          <label for="travel-date">Travel Date *</label>
          <input type="date" id="travel-date" name="travel_date" required />

          <label for="expense-category">Expense Category *</label>
          <select id="expense-category" name="expense_category" required>
            <option value="">Select category</option>
            <option value="Hotel">Hotel</option>
            <option value="Flight">Flight</option>
            <option value="Train">Train</option>
            <option value="Meals">Meals</option>
          </select>

          <label for="amount">Amount (INR) *</label>
          <input type="number" id="amount" name="amount" placeholder="e.g. 5000" required />

          <label for="description">Description</label>
          <textarea id="description" name="description" placeholder="Brief description..."></textarea>

          <!-- Section 4: Receipt Upload -->
          <label for="receipt-upload">Upload Receipt *</label>
          <input type="file" id="receipt-upload" name="receipt" accept="image/*" />

          <!-- Submit -->
          <button type="submit" id="btn-submit">Submit Reimbursement</button>
        </form>

        <div id="submission-card" style="display: none;">
          <h2>Reimbursement Claim Submitted Successfully!</h2>
          <span id="summary-category">—</span>
          <span id="summary-amount">—</span>
          <span id="summary-date">—</span>
          <span id="summary-emp-id">—</span>
        </div>
      </div>
    `;

    form = document.getElementById("reimbursement-form") as HTMLFormElement;
    submissionCard = document.getElementById("submission-card") as HTMLDivElement;

    // Attach portal submission handler matching app.js
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputCategory = document.getElementById("expense-category") as HTMLSelectElement;
      const inputAmount = document.getElementById("amount") as HTMLInputElement;
      const inputDate = document.getElementById("travel-date") as HTMLInputElement;
      const inputEmpId = document.getElementById("employee-id") as HTMLInputElement;

      const summaryCategory = document.getElementById("summary-category");
      const summaryAmount = document.getElementById("summary-amount");
      const summaryDate = document.getElementById("summary-date");
      const summaryEmpId = document.getElementById("summary-emp-id");

      if (summaryCategory) summaryCategory.textContent = inputCategory.value || "Expense";
      if (summaryAmount) summaryAmount.textContent = inputAmount.value ? `INR ${Number(inputAmount.value).toLocaleString("en-IN")}` : "INR 0";
      if (summaryDate) summaryDate.textContent = inputDate.value || "2026-09-12";
      if (summaryEmpId) summaryEmpId.textContent = inputEmpId.value || "EMP-2024-0042";

      form.style.display = "none";
      submissionCard.style.display = "block";
    });
  });

  it("should detect all 6 PII fields and store them in the local RAM TagVault", async () => {
    const sessionId = "session_test_p15_detection";
    const { entities, tags, sanitizedElements } = await runLocalRedaction(sessionId);

    // Verify 6 PII categories detected
    expect(entities.length).toBeGreaterThanOrEqual(6);
    const piiTypes = entities.map((e) => e.piiType);
    expect(piiTypes).toContain("PERSON_NAME");
    expect(piiTypes).toContain("EMPLOYEE_ID");
    expect(piiTypes).toContain("EMAIL");
    expect(piiTypes).toContain("PHONE");
    expect(piiTypes).toContain("BANK_ACCOUNT");
    expect(piiTypes).toContain("IFSC_CODE");

    // Verify opaque tags created
    expect(tags.length).toBeGreaterThanOrEqual(6);
    tags.forEach((t) => {
      expect(t.tagId).toMatch(/^TAG_\d{3}$/);
    });

    // Verify local RAM vault populated
    expect(getAllSessionTags(sessionId).length).toBeGreaterThanOrEqual(6);

    // Verify sanitized elements have zero raw PII values
    const sensitiveSanitized = sanitizedElements.filter((el) => el.isSensitive);
    expect(sensitiveSanitized.length).toBeGreaterThanOrEqual(6);
    sensitiveSanitized.forEach((el) => {
      expect(el.currentValue).toBeUndefined();
      expect(el.semanticLabel).not.toContain("Rahul Sharma");
      expect(el.semanticLabel).not.toContain("00112345678901");
      expect(el.semanticLabel).not.toContain("HDFC0001234");
    });
  });

  it("should pass Outbound Leak Guard with 0 bytes of sensitive data", async () => {
    const sessionId = "session_test_p15_leakguard";
    const { snapshot, entities, sanitizedElements } = await runLocalRedaction(sessionId);

    const agentRequest = await buildAgentRequest(
      sessionId,
      "Fill travel details for Hotel stay with amount 4500 on 2026-09-12 and submit reimbursement",
      sanitizedElements,
      snapshot.pageUrl,
      snapshot.pageTitle
    );

    const leakCheck = await checkForLeaks(agentRequest, entities);
    expect(leakCheck.passed).toBe(true);
    expect(leakCheck.shouldBlock).toBe(false);
    expect(leakCheck.detectedPIITypes).toHaveLength(0);
    expect(leakCheck.summary).toContain("CLEARED");
  });

  it("should execute the full autonomous task, fill travel details, and submit the claim", async () => {
    const sessionId = "session_test_p15_autonomous";
    const result = await runFullAutonomousTask(
      sessionId,
      "Fill travel details for Hotel stay with amount 4500 on 2026-09-12 and submit reimbursement"
    );

    expect(result.ok).toBe(true);
    expect(result.piiCount).toBeGreaterThanOrEqual(6);
    expect(result.tagsCreated).toBeGreaterThanOrEqual(6);
    expect(result.leakGuardPassed).toBe(true);
    expect(result.executionStatus).toBe("completed");
    expect(result.actionsExecuted).toBeGreaterThan(0);

    // Verify form input fields populated by actionDispatcher
    const inputCategory = document.getElementById("expense-category") as HTMLSelectElement;
    const inputAmount = document.getElementById("amount") as HTMLInputElement;
    const inputDate = document.getElementById("travel-date") as HTMLInputElement;

    expect(inputCategory.value).toBe("Hotel");
    expect(inputAmount.value).toBe("4500");
    expect(inputDate.value).toBe("2026-09-12");

    // Verify form submission triggered and confirmation card rendered
    expect(form.style.display).toBe("none");
    expect(submissionCard.style.display).toBe("block");

    const summaryCategory = document.getElementById("summary-category");
    const summaryAmount = document.getElementById("summary-amount");
    expect(summaryCategory?.textContent).toBe("Hotel");
    expect(summaryAmount?.textContent).toBe("INR 4,500");
  });

  it("should block autonomous execution if raw PII is forcibly injected into the outbound payload", async () => {
    const sessionId = "session_test_p15_block";
    // Injected task containing raw bank account
    const taintedTask = "Submit reimbursement for bank account 00112345678901";
    const result = await runFullAutonomousTask(sessionId, taintedTask);

    expect(result.ok).toBe(false);
    expect(result.leakGuardPassed).toBe(false);
    expect(result.executionStatus).toBe("blocked_by_leak_guard");
    expect(result.actionsExecuted).toBe(0);
    expect(result.error).toContain("BLOCKED");

    // Form must NOT be submitted
    expect(form.style.display).not.toBe("none");
    expect(submissionCard.style.display).toBe("none");
  });
});
