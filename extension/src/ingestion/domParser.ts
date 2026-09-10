/**
 * CloakSight — DOM Parser
 *
 * Walks the live DOM of the webpage and constructs a normalized, structured
 * DOMElement tree and PageSnapshot.
 *
 * PRIVACY NOTE:
 * All extracted values (values, text, placeholders, attributes) remain strictly
 * inside the LOCAL TRUSTED ZONE. They must NEVER be sent to the cloud.
 */

import type { DOMElement, ElementRole, ElementVisibility, PageSnapshot } from "../types/dom";
import type { UniqueId } from "../types/common";
import { registerElement, clearRegistry } from "../action/elementRegistry";
import { getElementBoundingRect, isRectInViewport } from "./layoutExtractor";
import { createLogger } from "../utils/logger";

const logger = createLogger("domParser");

let elementCounter = 0;

/**
 * Generate a deterministic/stable unique ID for a DOM element during a session.
 */
function generateElementId(prefix = "el"): UniqueId {
  elementCounter += 1;
  return `${prefix}_${elementCounter.toString().padStart(4, "0")}`;
}

/**
 * Infer semantic role from an HTML Element.
 */
export function inferRole(element: Element): ElementRole {
  const tag = element.tagName.toLowerCase();
  const explicitRole = element.getAttribute("role")?.toLowerCase();

  if (tag === "input") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    switch (type) {
      case "password":
        return "input_password";
      case "email":
        return "input_email";
      case "tel":
      case "phone":
        return "input_phone";
      case "number":
        return "input_number";
      case "file":
        return "input_file";
      case "checkbox":
        return "input_checkbox";
      case "radio":
        return "input_radio";
      case "submit":
      case "button":
      case "reset":
        return "button_submit";
      default:
        return "input_text";
    }
  }

  if (tag === "select") return "select";
  if (tag === "textarea") return "textarea";

  if (tag === "button" || explicitRole === "button") {
    const type = element.getAttribute("type")?.toLowerCase();
    return type === "submit" ? "button_submit" : "button_generic";
  }

  if (tag === "a" || explicitRole === "link") return "link";
  if (tag === "label") return "label";
  if (tag === "form") return "form";

  if (/^h[1-6]$/.test(tag) || explicitRole === "heading") return "heading";
  if (tag === "p") return "paragraph";
  if (tag === "img" || explicitRole === "img") return "image";

  return "unknown";
}

/**
 * Determine the visibility state of a DOM element.
 */
export function checkVisibility(element: Element): ElementVisibility {
  if (element.hasAttribute("hidden")) {
    return "hidden_attribute";
  }

  if (element.tagName.toLowerCase() === "input" && element.getAttribute("type")?.toLowerCase() === "hidden") {
    return "hidden_attribute";
  }

  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    try {
      const style = window.getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return "hidden_css";
      }
    } catch {
      // Ignore errors in mock environments
    }
  }

  const rect = getElementBoundingRect(element);
  if (rect.width > 0 && rect.height > 0 && !isRectInViewport(rect)) {
    return "offscreen";
  }

  return "visible";
}

/**
 * Determine if an element is interactive (clickable, typeable, selectable).
 */
export function checkIsInteractive(element: Element, role: ElementRole): boolean {
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
    return false;
  }

  // Interactive roles
  if (
    role.startsWith("input_") ||
    role === "select" ||
    role === "textarea" ||
    role.startsWith("button_") ||
    role === "link"
  ) {
    return true;
  }

  // Check tabindex and contenteditable
  if (element.hasAttribute("tabindex")) {
    const tabIndex = parseInt(element.getAttribute("tabindex") || "-1", 10);
    if (tabIndex >= 0) return true;
  }

  if (element.getAttribute("contenteditable") === "true") {
    return true;
  }

  return false;
}

/**
 * Compute the accessible label for an element.
 * Checks aria-label, aria-labelledby, associated <label for="...">, parent <label>, or title.
 */
export function getAccessibleLabel(element: Element): string {
  // 1. Direct aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel && ariaLabel.trim()) {
    return ariaLabel.trim();
  }

  // 2. aria-labelledby
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy && typeof document !== "undefined") {
    const target = document.getElementById(labelledBy);
    if (target && target.textContent) {
      return target.textContent.trim();
    }
  }

  // 3. Associated <label for="id">
  const id = element.getAttribute("id");
  if (id && typeof document !== "undefined") {
    try {
      const labelEl = document.querySelector(`label[for="${id}"]`);
      if (labelEl && labelEl.textContent) {
        return labelEl.textContent.trim();
      }
    } catch {
      // Ignored for invalid CSS selector characters
    }
  }

  // 4. Enclosing parent <label>
  const parentLabel = element.closest("label");
  if (parentLabel && parentLabel !== element) {
    // Clone and remove the element itself to get just the label text
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    const innerTarget = clone.querySelector(`#${id}`) || clone.querySelector(element.tagName);
    if (innerTarget) innerTarget.remove();
    const labelText = (clone.textContent || "").trim();
    if (labelText) return labelText;
  }

  // 5. Placeholder or title
  const placeholder = element.getAttribute("placeholder");
  if (placeholder && placeholder.trim()) {
    return placeholder.trim();
  }

  const title = element.getAttribute("title");
  if (title && title.trim()) {
    return title.trim();
  }

  // 6. Image alt text
  if (element.tagName.toLowerCase() === "img") {
    const alt = element.getAttribute("alt");
    if (alt && alt.trim()) return alt.trim();
  }

  return "";
}

/**
 * Heuristically detect whether an element appears to be a sensitive PII input field.
 */
export function checkLooksLikeSensitiveField(
  element: Element,
  role: ElementRole,
  label: string,
): boolean {
  if (role === "input_password" || role === "input_phone" || role === "input_email") return true;

  const id = (element.getAttribute("id") || "").toLowerCase();
  const name = (element.getAttribute("name") || "").toLowerCase();
  const autocomplete = (element.getAttribute("autocomplete") || "").toLowerCase();
  const type = (element.getAttribute("type") || "").toLowerCase();
  const labelLower = label.toLowerCase();

  if (type === "tel" || type === "password" || type === "email") {
    return true;
  }

  const sensitiveKeywords = [
    "password",
    "secret",
    "token",
    "ssn",
    "aadhaar",
    "aadhar",
    "pan",
    "tax",
    "card",
    "cvv",
    "cvc",
    "credit",
    "debit",
    "bank",
    "account",
    "ifsc",
    "salary",
    "income",
    "dob",
    "birth",
    "passport",
    "phone",
    "mobile",
    "tel",
    "contact",
    "email",
  ];

  for (const keyword of sensitiveKeywords) {
    if (
      id.includes(keyword) ||
      name.includes(keyword) ||
      autocomplete.includes(keyword) ||
      labelLower.includes(keyword)
    ) {
      return true;
    }
  }

  return false;
}


/**
 * Generate a simplified, resilient CSS selector for an element.
 */
export function generateCssSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const name = element.getAttribute("name");
  if (name) {
    return `${element.tagName.toLowerCase()}[name="${name}"]`;
  }

  const role = element.getAttribute("role");
  if (role) {
    return `${element.tagName.toLowerCase()}[role="${role}"]`;
  }

  let path = element.tagName.toLowerCase();
  let parent = element.parentElement;

  while (parent && parent !== document.body && parent !== document.documentElement) {
    if (parent.id) {
      path = `#${parent.id} > ${path}`;
      break;
    }
    const index = Array.from(parent.children).indexOf(element) + 1;
    path = `${parent.tagName.toLowerCase()} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
    break;
  }

  return path;
}

/**
 * Generate an XPath for an element.
 */
export function generateXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const paths: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && (sibling as Element).tagName === current.tagName) {
        index += 1;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const pathIndex = index > 0 ? `[${index + 1}]` : "";
    paths.unshift(`${tagName}${pathIndex}`);
    current = current.parentElement;
  }

  return paths.length ? `/${paths.join("/")}` : "";
}

/**
 * Extract safe attributes from an element.
 */
function extractAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  const allowed = [
    "id",
    "name",
    "type",
    "class",
    "role",
    "placeholder",
    "value",
    "autocomplete",
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "disabled",
    "readonly",
    "required",
    "href",
    "src",
    "alt",
    "title",
    "action",
    "method",
  ];

  for (const name of allowed) {
    const val = element.getAttribute(name);
    if (val !== null) {
      // Truncate overly long values to avoid memory bloat
      attrs[name] = val.length > 500 ? val.slice(0, 500) + "..." : val;
    }
  }

  return attrs;
}

/**
 * Parse a single live DOM element into a normalized DOMElement.
 */
export function parseElement(
  element: Element,
  _sessionId: UniqueId,
  parentId?: UniqueId,
): DOMElement {
  const elementId = generateElementId();
  const tagName = element.tagName.toLowerCase();
  const role = inferRole(element);
  const visibility = checkVisibility(element);
  const accessibleLabel = getAccessibleLabel(element);
  const isInteractive = checkIsInteractive(element, role);
  const looksLikeSensitiveField = checkLooksLikeSensitiveField(element, role, accessibleLabel);
  const boundingRect = getElementBoundingRect(element);
  const attributes = extractAttributes(element);

  let value: string | undefined;
  if ("value" in element) {
    value = (element as HTMLInputElement).value;
  }

  let textContent: string | undefined;
  if (element.children.length === 0) {
    textContent = (element.textContent || "").trim();
  }

  const placeholder = element.getAttribute("placeholder") || undefined;
  const cssSelector = generateCssSelector(element);
  const xpath = generateXPath(element);

  // Register the element with live reference in memory
  registerElement(elementId, element, role, tagName);

  return {
    elementId,
    tagName,
    role,
    visibility,
    textContent,
    value,
    placeholder,
    accessibleLabel: accessibleLabel || undefined,
    attributes,
    boundingRect,
    isInteractive,
    looksLikeSensitiveField,
    childIds: [],
    parentId,
    xpath,
    cssSelector,
  };
}

/**
 * Find all interactive elements within a given root or the document.
 */
export function findInteractiveElements(root?: Element): Element[] {
  const scope = root || (typeof document !== "undefined" ? document.body : null);
  if (!scope) return [];

  const selector = [
    "button",
    "a[href]",
    "input:not([type='hidden'])",
    "select",
    "textarea",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
    "[role='button']",
    "[role='link']",
    "[role='checkbox']",
    "[role='textbox']",
  ].join(",");

  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Parse the full page DOM and produce a complete PageSnapshot.
 *
 * PRIVACY: The snapshot contains raw DOM values including potential PII.
 * This runs entirely on-device and must NEVER be transmitted.
 *
 * @param sessionId Unique session identifier
 * @param root Optional root element/document (defaults to window.document)
 */
export async function parsePage(
  sessionId: UniqueId,
  root?: Element | Document,
): Promise<PageSnapshot> {
  logger.info("Starting DOM ingestion for page", { sessionId });
  elementCounter = 0; // Reset counter for new snapshot

  const doc = root instanceof Document ? root : (root ? root.ownerDocument : (typeof document !== "undefined" ? document : null));
  const rootElement = root instanceof Element ? root : (doc ? doc.body : null);

  if (!doc || !rootElement) {
    throw new Error("Unable to parse DOM: document or body is not available.");
  }

  const pageUrl = typeof window !== "undefined" ? window.location.href : "https://local.page";
  const pageTitle = doc.title || "";
  const capturedAt = new Date().toISOString();

  // Clear previous session element registrations
  clearRegistry(sessionId);

  const elementsMap: Record<UniqueId, DOMElement> = {};
  let interactiveCount = 0;

  // Walk the DOM tree
  function walkTree(element: Element, parentId?: UniqueId): DOMElement {
    const domElement = parseElement(element, sessionId, parentId);
    elementsMap[domElement.elementId] = domElement;

    if (domElement.isInteractive) {
      interactiveCount += 1;
    }

    const childIds: UniqueId[] = [];
    const children = Array.from(element.children);

    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      // Skip non-UI elements
      if (tag === "script" || tag === "style" || tag === "noscript") {
        continue;
      }
      const childDOMElement = walkTree(child, domElement.elementId);
      childIds.push(childDOMElement.elementId);
    }

    domElement.childIds = childIds;
    return domElement;
  }

  const rootDOMElement = walkTree(rootElement);

  // Extract visible page text
  const rawPageText = (rootElement.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  const snapshot: PageSnapshot = {
    sessionId,
    tabId: 0,
    pageUrl,
    pageTitle,
    elements: elementsMap,
    rootElementId: rootDOMElement.elementId,
    rawPageText,
    capturedAt,
    elementCount: Object.keys(elementsMap).length,
    interactiveElementCount: interactiveCount,
  };

  logger.info("DOM ingestion complete", {
    elementCount: snapshot.elementCount,
    interactiveElementCount: snapshot.interactiveElementCount,
  });

  return snapshot;
}
