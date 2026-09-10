/**
 * CloakSight Demo — Reimbursement Portal JavaScript (Phase 15)
 *
 * Provides interactive autofill buttons for hackathon demonstration,
 * handles real-time form validation, and renders the post-submission
 * CloakSight Privacy Guard verification report.
 */

"use strict";

const form = document.getElementById("reimbursement-form");
const btnAutofillProfile = document.getElementById("btn-autofill-profile");
const btnAutofillTrip = document.getElementById("btn-autofill-trip");
const submissionCard = document.getElementById("submission-card");
const btnNewClaim = document.getElementById("btn-new-claim");

// Inputs
const inputName = document.getElementById("employee-name");
const inputEmpId = document.getElementById("employee-id");
const inputEmail = document.getElementById("email");
const inputPhone = document.getElementById("phone");
const inputBank = document.getElementById("bank-account");
const inputIfsc = document.getElementById("ifsc-code");
const inputDate = document.getElementById("travel-date");
const inputCategory = document.getElementById("expense-category");
const inputAmount = document.getElementById("amount");
const inputDescription = document.getElementById("description");

// Summary display elements
const summaryCategory = document.getElementById("summary-category");
const summaryAmount = document.getElementById("summary-amount");
const summaryDate = document.getElementById("summary-date");
const summaryEmpId = document.getElementById("summary-emp-id");
const claimRefId = document.getElementById("claim-ref-id");

// 1. Quick Autofill Sample Employee Profile (PII)
if (btnAutofillProfile) {
  btnAutofillProfile.addEventListener("click", () => {
    if (inputName) inputName.value = "Rahul Sharma";
    if (inputEmpId) inputEmpId.value = "EMP-2024-0042";
    if (inputEmail) inputEmail.value = "rahul@company.com";
    if (inputPhone) inputPhone.value = "+91 98765 43210";
    if (inputBank) inputBank.value = "00112345678901";
    if (inputIfsc) inputIfsc.value = "HDFC0001234";

    // Trigger input events so extensions and observers detect changes
    [inputName, inputEmpId, inputEmail, inputPhone, inputBank, inputIfsc].forEach((el) => {
      el?.dispatchEvent(new Event("input", { bubbles: true }));
      el?.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

// 2. Quick Autofill Jalgaon Hotel Claim
if (btnAutofillTrip) {
  btnAutofillTrip.addEventListener("click", () => {
    if (inputDate) inputDate.value = "2026-09-12";
    if (inputCategory) inputCategory.value = "Hotel";
    if (inputAmount) inputAmount.value = "4500";
    if (inputDescription) inputDescription.value = "Hotel stay in Jalgaon for technical site audit (Receipt #JAL-2026-88).";

    [inputDate, inputCategory, inputAmount, inputDescription].forEach((el) => {
      el?.dispatchEvent(new Event("input", { bubbles: true }));
      el?.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

// 3. Form Submit Handler & Privacy Proof Rendering
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const category = inputCategory?.value || "Expense";
    const amount = inputAmount?.value ? `INR ${Number(inputAmount.value).toLocaleString("en-IN")}` : "INR 0";
    const date = inputDate?.value || new Date().toISOString().split("T")[0];
    const empId = inputEmpId?.value || "EMP-XXXX";

    if (summaryCategory) summaryCategory.textContent = category;
    if (summaryAmount) summaryAmount.textContent = amount;
    if (summaryDate) summaryDate.textContent = date;
    if (summaryEmpId) summaryEmpId.textContent = empId;
    if (claimRefId) claimRefId.textContent = `ACME-CLM-${Math.floor(10000 + Math.random() * 90000)}`;

    // Transition view from form to confirmation card
    form.style.display = "none";
    if (submissionCard) {
      submissionCard.style.display = "block";
      submissionCard.scrollIntoView({ behavior: "smooth" });
    }
  });
}

// 4. Reset & New Claim Handler
if (btnNewClaim) {
  btnNewClaim.addEventListener("click", () => {
    if (form) {
      form.reset();
      form.style.display = "flex";
    }
    if (submissionCard) {
      submissionCard.style.display = "none";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
