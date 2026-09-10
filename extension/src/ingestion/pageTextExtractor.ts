/**
 * CloakSight — Page Text Extractor
 *
 * Extracts visible and meaningful text from the page while preserving element context.
 * Used by on-device NLP and PII detectors to identify sensitive text in context.
 *
 * PRIVACY: Extracted text contains raw user/webpage data.
 * Must stay strictly inside the LOCAL TRUSTED ZONE.
 */

import type { UniqueId } from "../types/common";
import { getElementId } from "../action/elementRegistry";
import { createLogger } from "../utils/logger";

const logger = createLogger("pageTextExtractor");

export interface TextChunk {
  /** The raw text content (LOCAL ONLY — may contain PII) */
  text: string;
  /** Source element ID in the element registry */
  sourceElementId: UniqueId;
  /** Whether this chunk is from a visible element */
  isVisible: boolean;
}

const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "CANVAS",
  "TEMPLATE",
  "AUDIO",
  "VIDEO",
  "IFRAME",
]);

/**
 * Check whether an element is visible in the page.
 */
function checkIsVisible(el: Element): boolean {
  if (el.hasAttribute("hidden")) return false;
  if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    try {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return false;
      }
    } catch {
      // Ignored in non-browser environments
    }
  }
  return true;
}

/**
 * Extract clean textual content from a single DOM element.
 * For inputs and textareas, returns their value or placeholder.
 * For other elements, returns their trimmed textContent.
 */
export function extractElementText(element: Element): string {
  const tagName = element.tagName.toUpperCase();

  if (tagName === "INPUT") {
    const input = element as HTMLInputElement;
    const type = (input.type || "text").toLowerCase();
    if (type === "password") {
      return input.value ? "••••••••" : (input.placeholder || "");
    }
    return input.value || input.placeholder || "";
  }

  if (tagName === "TEXTAREA") {
    const textarea = element as HTMLTextAreaElement;
    return textarea.value || textarea.placeholder || "";
  }

  if (tagName === "SELECT") {
    const select = element as HTMLSelectElement;
    const selectedOption = select.options[select.selectedIndex];
    return selectedOption ? selectedOption.text : "";
  }

  return (element.textContent || "").trim();
}

/**
 * Extract all visible text chunks from the DOM tree, preserving element context.
 *
 * @param _sessionId Session identifier
 * @param rootElement Root element to start walking (defaults to document.body)
 * @returns Array of TextChunks associated with their source element IDs
 */
export async function extractPageText(
  _sessionId: UniqueId,
  rootElement?: Element,
): Promise<TextChunk[]> {
  logger.debug("extractPageText started");
  const chunks: TextChunk[] = [];

  const root = rootElement || (typeof document !== "undefined" ? document.body : null);
  if (!root) {
    return chunks;
  }

  function walk(node: Node, parentVisible: boolean) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toUpperCase();

      if (IGNORED_TAGS.has(tag)) {
        return;
      }

      const isCurrentVisible = parentVisible && checkIsVisible(el);
      const elementId = getElementId(el);

      // Check form controls directly (inputs, textareas, buttons)
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        const text = extractElementText(el);
        if (text && text.trim().length > 0 && elementId) {
          chunks.push({
            text: text.trim(),
            sourceElementId: elementId,
            isVisible: isCurrentVisible,
          });
        }
        return; // Don't inspect child nodes of input elements
      }

      // Check aria-label or title attributes if present
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.trim().length > 0 && elementId) {
        chunks.push({
          text: ariaLabel.trim(),
          sourceElementId: elementId,
          isVisible: isCurrentVisible,
        });
      }

      // Recurse into children
      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i], isCurrentVisible);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const rawText = (node.nodeValue || "").trim();
      if (rawText.length > 0 && node.parentElement) {
        const parentEl = node.parentElement;
        const parentTag = parentEl.tagName.toUpperCase();
        if (!IGNORED_TAGS.has(parentTag)) {
          const sourceElementId = getElementId(parentEl);
          if (sourceElementId) {
            chunks.push({
              text: rawText,
              sourceElementId,
              isVisible: parentVisible,
            });
          }
        }
      }
    }
  }

  walk(root, checkIsVisible(root));
  logger.debug("extractPageText completed", { chunkCount: chunks.length });
  return chunks;
}
