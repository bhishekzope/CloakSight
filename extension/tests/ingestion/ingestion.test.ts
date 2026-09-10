// @vitest-environment jsdom
/**
 * CloakSight — Phase 2 DOM Ingestion Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { parsePage, parseElement, findInteractiveElements, inferRole, getAccessibleLabel, checkLooksLikeSensitiveField } from "../../src/ingestion/domParser";
import { extractPageText, extractElementText } from "../../src/ingestion/pageTextExtractor";
import { extractLayout, getElementBoundingRect } from "../../src/ingestion/layoutExtractor";
import { registerElement, lookupElement, getElement, getElementId, clearRegistry, getRegistrySize } from "../../src/action/elementRegistry";

describe("Phase 2: DOM Ingestion", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    clearRegistry();
  });

  describe("domParser & Element Normalization", () => {
    it("should parse a complete page and produce a valid PageSnapshot", async () => {
      document.body.innerHTML = `
        <div id="app">
          <h1>Reimbursement Portal</h1>
          <form id="reimbursement-form">
            <label for="emp-name">Employee Name</label>
            <input id="emp-name" type="text" value="Alice Smith" placeholder="Full Name" />
            
            <label for="emp-id">Employee ID</label>
            <input id="emp-id" type="text" value="EMP-1049" />

            <label for="aadhaar">Aadhaar Number</label>
            <input id="aadhaar" type="text" name="aadhaar_no" value="2345 6789 0123" />

            <label for="category">Expense Category</label>
            <select id="category">
              <option value="hotel" selected>Hotel Stay</option>
              <option value="travel">Flight</option>
            </select>

            <button id="submit-btn" type="submit">Submit Claim</button>
          </form>
        </div>
      `;

      const snapshot = await parsePage("test_session_001", document);

      expect(snapshot.sessionId).toBe("test_session_001");
      expect(snapshot.elementCount).toBeGreaterThan(5);
      expect(snapshot.interactiveElementCount).toBeGreaterThanOrEqual(4); // 3 inputs + 1 select + 1 button
      expect(snapshot.rawPageText).toContain("Reimbursement Portal");

      // Verify individual elements in snapshot
      const elements = Object.values(snapshot.elements);
      const nameInput = elements.find((e) => e.attributes.id === "emp-name");
      expect(nameInput).toBeDefined();
      expect(nameInput?.role).toBe("input_text");
      expect(nameInput?.accessibleLabel).toBe("Employee Name");
      expect(nameInput?.value).toBe("Alice Smith");
      expect(nameInput?.isInteractive).toBe(true);

      const submitBtn = elements.find((e) => e.attributes.id === "submit-btn");
      expect(submitBtn).toBeDefined();
      expect(submitBtn?.role).toBe("button_submit");
      expect(submitBtn?.isInteractive).toBe(true);
    });

    it("should accurately detect sensitive PII fields", () => {
      document.body.innerHTML = `
        <input id="user-password" type="password" />
        <input id="pan-number" name="pan_card" type="text" />
        <input id="bank-acc" name="bank_account_no" type="text" />
        <input id="city-input" name="city" type="text" />
      `;

      const pw = document.getElementById("user-password")!;
      const pan = document.getElementById("pan-number")!;
      const bank = document.getElementById("bank-acc")!;
      const city = document.getElementById("city-input")!;

      expect(checkLooksLikeSensitiveField(pw, "input_password", "Password")).toBe(true);
      expect(checkLooksLikeSensitiveField(pan, "input_text", "PAN Number")).toBe(true);
      expect(checkLooksLikeSensitiveField(bank, "input_text", "Bank Account")).toBe(true);
      expect(checkLooksLikeSensitiveField(city, "input_text", "City")).toBe(false);
    });

    it("should correctly identify element roles", () => {
      document.body.innerHTML = `
        <input id="email" type="email" />
        <input id="tel" type="tel" />
        <textarea id="desc"></textarea>
        <a id="link" href="/help">Help</a>
        <p id="para">Some description</p>
      `;

      expect(inferRole(document.getElementById("email")!)).toBe("input_email");
      expect(inferRole(document.getElementById("tel")!)).toBe("input_phone");
      expect(inferRole(document.getElementById("desc")!)).toBe("textarea");
      expect(inferRole(document.getElementById("link")!)).toBe("link");
      expect(inferRole(document.getElementById("para")!)).toBe("paragraph");
    });

    it("should resolve accessible labels through aria, label-for, and parent wrapping", () => {
      document.body.innerHTML = `
        <button id="b1" aria-label="Close Dialog">X</button>
        <label for="inp1">Phone Number</label>
        <input id="inp1" type="tel" />
        <label>
          Delivery Address
          <input id="inp2" type="text" />
        </label>
      `;

      expect(getAccessibleLabel(document.getElementById("b1")!)).toBe("Close Dialog");
      expect(getAccessibleLabel(document.getElementById("inp1")!)).toBe("Phone Number");
      expect(getAccessibleLabel(document.getElementById("inp2")!)).toContain("Delivery Address");
    });

    it("should handle hidden inputs and elements gracefully", async () => {
      document.body.innerHTML = `
        <input id="csrf" type="hidden" value="secret_token_123" />
        <div id="hidden-div" hidden>Hidden content</div>
      `;

      const snapshot = await parsePage("test_session_hidden", document);
      const elements = Object.values(snapshot.elements);

      const csrf = elements.find((e) => e.attributes.id === "csrf");
      expect(csrf?.visibility).toBe("hidden_attribute");

      const hiddenDiv = elements.find((e) => e.attributes.id === "hidden-div");
      expect(hiddenDiv?.visibility).toBe("hidden_attribute");
    });

    it("should find all interactive elements on the page", () => {
      document.body.innerHTML = `
        <div>
          <button id="btn1">Click me</button>
          <a href="#test">Link</a>
          <input type="text" />
          <p>Not interactive</p>
          <div role="button" tabindex="0">Custom button</div>
          <button disabled>Disabled button</button>
        </div>
      `;

      const interactive = findInteractiveElements(document.body);
      expect(interactive.length).toBe(5); // button, a, input, custom button, disabled button
    });
  });

  describe("ElementRegistry", () => {
    it("should register elements and allow live retrieval", () => {
      const button = document.createElement("button");
      button.id = "btn-live";
      document.body.appendChild(button);

      const entry = registerElement("tag_001", button, "button_generic");
      expect(entry.tagId).toBe("tag_001");
      expect(entry.isValid).toBe(true);

      const retrieved = getElement("tag_001");
      expect(retrieved).toBe(button);
      expect(getElementId(button)).toBe("tag_001");
      expect(getRegistrySize()).toBe(1);
    });

    it("should detect when a registered element is removed from the DOM", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);

      registerElement("tag_input", input, "input_text");
      expect(lookupElement("tag_input")?.isValid).toBe(true);

      // Remove from DOM
      input.remove();
      expect(lookupElement("tag_input")?.isValid).toBe(false);
      expect(getElement("tag_input")).toBeUndefined();
    });
  });

  describe("pageTextExtractor", () => {
    it("should extract visible text chunks while skipping scripts and styles", async () => {
      document.body.innerHTML = `
        <div>
          <h2>Invoice Header</h2>
          <p>Please review your expenses below.</p>
          <script>console.log("secret inline script");</script>
          <style>.hide { display: none; }</style>
        </div>
      `;

      // Ingest DOM first to populate element registry IDs
      await parsePage("test_text_session", document);

      const chunks = await extractPageText("test_text_session", document.body);
      const combinedText = chunks.map((c) => c.text).join(" ");

      expect(combinedText).toContain("Invoice Header");
      expect(combinedText).toContain("Please review your expenses below.");
      expect(combinedText).not.toContain("secret inline script");
      expect(combinedText).not.toContain(".hide");
    });

    it("should extract input field text and select values", () => {
      document.body.innerHTML = `
        <input id="note" type="text" value="Business lunch" />
        <textarea id="memo">Meeting notes</textarea>
      `;

      expect(extractElementText(document.getElementById("note")!)).toBe("Business lunch");
      expect(extractElementText(document.getElementById("memo")!)).toBe("Meeting notes");
    });
  });

  describe("layoutExtractor", () => {
    it("should calculate bounding rectangles safely", () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const rect = getElementBoundingRect(div);
      expect(rect).toHaveProperty("x");
      expect(rect).toHaveProperty("y");
      expect(rect).toHaveProperty("width");
      expect(rect).toHaveProperty("height");
    });

    it("should extract layout metadata for registered element IDs", async () => {
      const snapshot = await parsePage("test_layout_session", document);
      const elementIds = Object.keys(snapshot.elements);

      const layouts = await extractLayout(elementIds);
      expect(layouts.length).toBe(elementIds.length);
      expect(layouts[0]).toHaveProperty("boundingRect");
      expect(layouts[0]).toHaveProperty("isVisible");
    });
  });
});
