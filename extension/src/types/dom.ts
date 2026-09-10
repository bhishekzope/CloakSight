/**
 * CloakSight — DOM Types
 *
 * Types representing the raw DOM snapshot.
 *
 * PRIVACY NOTE: These types may contain raw PII from the page.
 * They must NEVER be serialized into outbound messages.
 * They are LOCAL TRUSTED ZONE data only.
 */

import type { BoundingRect, UniqueId } from "./common";

// ============================================================
// DOM Element
// ============================================================

/** Semantic role of a DOM element in the UI */
export type ElementRole =
  | "input_text"
  | "input_password"
  | "input_email"
  | "input_phone"
  | "input_number"
  | "input_file"
  | "input_checkbox"
  | "input_radio"
  | "select"
  | "textarea"
  | "button_submit"
  | "button_generic"
  | "link"
  | "label"
  | "form"
  | "heading"
  | "paragraph"
  | "image"
  | "unknown";

/** Visibility state of a DOM element */
export type ElementVisibility =
  | "visible"
  | "hidden_css"
  | "hidden_attribute"
  | "offscreen"
  | "shadow_dom";

/**
 * A normalized representation of a single DOM element.
 *
 * PRIVACY: `textContent` and `value` may contain raw PII.
 * Keep strictly local.
 */
export interface DOMElement {
  /** Unique ID assigned by CloakSight for this session */
  elementId: UniqueId;

  /** HTML tag name (lowercased) */
  tagName: string;

  /** Inferred semantic role */
  role: ElementRole;

  /** Element visibility status */
  visibility: ElementVisibility;

  /** Raw text content of the element (LOCAL ONLY — may contain PII) */
  textContent?: string | undefined;

  /** Current value of input/select/textarea elements (LOCAL ONLY — may contain PII) */
  value?: string | undefined;

  /** Placeholder text of input elements */
  placeholder?: string | undefined;

  /** aria-label or title attribute */
  accessibleLabel?: string | undefined;

  /** Selected HTML attributes (class, id, name, type, etc.) */
  attributes: Record<string, string>;

  /** Bounding rectangle in page coordinates */
  boundingRect: BoundingRect;

  /** Whether the element is interactive */
  isInteractive: boolean;

  /** Whether the element appears to be a sensitive data field */
  looksLikeSensitiveField: boolean;

  /** Child element IDs (tree structure) */
  childIds: UniqueId[];

  /** Parent element ID */
  parentId?: UniqueId | undefined;

  /** XPath for the element */
  xpath?: string | undefined;

  /** CSS selector for the element */
  cssSelector?: string | undefined;
}

// ============================================================
// Page Snapshot
// ============================================================

/**
 * A complete snapshot of the current page's DOM state.
 *
 * PRIVACY: Contains raw DOM content. Keep strictly local.
 */
export interface PageSnapshot {
  /** Session this snapshot belongs to */
  sessionId: UniqueId;

  /** Tab ID */
  tabId: number;

  /** Full page URL */
  pageUrl: string;

  /** Page title */
  pageTitle: string;

  /** All extracted DOM elements, keyed by elementId */
  elements: Record<UniqueId, DOMElement>;

  /** ID of the root element */
  rootElementId: UniqueId;

  /** Raw visible text from the page (LOCAL ONLY — may contain PII) */
  rawPageText: string;

  /** Base64-encoded screenshot, if captured (LOCAL ONLY — may contain visual PII) */
  screenshotDataUrl?: string;

  /** Snapshot creation timestamp */
  capturedAt: string;

  /** Total element count */
  elementCount: number;

  /** Interactive element count */
  interactiveElementCount: number;
}
