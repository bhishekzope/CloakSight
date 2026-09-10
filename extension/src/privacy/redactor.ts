/**
 * CloakSight — Redactor
 *
 * Replaces detected PII in DOM elements and free text with semantic tags.
 * Produces `SanitizedElement[]` — the cloud-safe structural representation.
 *
 * PRIVACY:
 *   Input: DOMElement[] + SensitiveEntity[] + SemanticTag[]
 *   Output: SanitizedElement[] — NO raw PII values, only opaque tag IDs and semantic tokens.
 */

import type { SanitizedElement, SensitiveEntity, SemanticTag } from "../types/privacy";
import type { DOMElement } from "../types/dom";
import { createLogger } from "../utils/logger";

const logger = createLogger("redactor");

/**
 * Produce a cloud-safe SanitizedElement from a DOMElement.
 * If the element contains PII, its raw value is completely stripped
 * and replaced with the assigned SemanticTag token and tag ID.
 *
 * @param element The raw local DOMElement
 * @param entities Detected sensitive entities in the page
 * @param tags Generated semantic tags
 * @returns Cloud-safe SanitizedElement
 */
export function redactElement(
  element: DOMElement,
  entities: SensitiveEntity[],
  tags: SemanticTag[],
): SanitizedElement {
  // Find if this element is associated with any detected PII entity / tag
  const matchingTag = tags.find(
    (t) => t.associatedElementId === element.elementId,
  );

  const matchingEntity = entities.find(
    (e) => e.sourceElementId === element.elementId,
  );

  const isSensitive = !!(matchingTag || matchingEntity || element.looksLikeSensitiveField);

  if (isSensitive) {
    // SENSITIVE ELEMENT: Completely strip raw value, expose only Tag ID & Semantic Label
    const tagId = matchingTag?.tagId || `TAG_${element.elementId.replace(/[^0-9]/g, "").padStart(3, "0")}`;
    const semanticLabel =
      matchingTag?.semanticLabel ||
      (matchingEntity ? `[${matchingEntity.piiType}]` : (
        element.role === "input_phone" ? "[PHONE]" :
        element.role === "input_email" ? "[EMAIL]" :
        element.role === "input_password" ? "[PASSWORD]" :
        "[SENSITIVE_FIELD]"
      ));

    return {
      tagId,
      semanticLabel,
      elementType: element.tagName,
      elementRole: element.role,
      isSensitive: true,
      currentValue: undefined, // RAW VALUE STRIPPED
      position: {
        x: element.boundingRect.x,
        y: element.boundingRect.y,
        width: element.boundingRect.width,
        height: element.boundingRect.height,
      },
      isInteractive: element.isInteractive,
      isVisible: element.visibility === "visible",
    };
  }

  // NON-SENSITIVE ELEMENT: Safe to preserve benign text / options (e.g. "Hotel Stay", "Submit")
  let safeLabel = element.accessibleLabel || element.textContent || element.tagName;
  let safeValue = element.value || element.textContent || undefined;

  // Scrub any accidental PII from label or value using the known detected entities
  safeLabel = redactText(safeLabel, entities, tags);
  if (safeValue) {
    safeValue = redactText(safeValue, entities, tags);
  }

  return {
    tagId: element.elementId,
    semanticLabel: safeLabel,
    elementType: element.tagName,
    elementRole: element.role,
    isSensitive: false,
    currentValue: safeValue,
    position: {
      x: element.boundingRect.x,
      y: element.boundingRect.y,
      width: element.boundingRect.width,
      height: element.boundingRect.height,
    },
    isInteractive: element.isInteractive,
    isVisible: element.visibility === "visible",
  };
}

/**
 * Redact all elements in a snapshot, returning the cloud-safe SanitizedElement list.
 */
export function redactElements(
  elements: DOMElement[],
  entities: SensitiveEntity[],
  tags: SemanticTag[],
): SanitizedElement[] {
  const sanitized: SanitizedElement[] = [];

  for (const el of elements) {
    sanitized.push(redactElement(el, entities, tags));
  }

  const sensitiveCount = sanitized.filter((s) => s.isSensitive).length;
  logger.info("Redacted elements successfully", {
    totalElements: elements.length,
    sensitiveElementsRedacted: sensitiveCount,
    nonSensitiveElementsPreserved: elements.length - sensitiveCount,
  });

  return sanitized;
}

/**
 * Redact occurrences of sensitive entity values within raw text strings.
 * Replaces real values with their semantic labels (e.g. "Rahul Sharma" -> "[PERSON_NAME]").
 */
export function redactText(
  rawText: string,
  entities: SensitiveEntity[],
  tags: SemanticTag[],
): string {
  if (!rawText || entities.length === 0) {
    return rawText;
  }

  let sanitized = rawText;

  for (const entity of entities) {
    const matchingTag = tags.find(
      (t) => t.piiType === entity.piiType && t.associatedElementId === entity.sourceElementId,
    );
    const replacement = matchingTag ? matchingTag.semanticLabel : `[${entity.piiType}]`;

    // Replace all occurrences of the raw value in the text
    if (entity.rawValue && entity.rawValue.length > 0) {
      // Escape special regex characters in the raw value
      const escaped = entity.rawValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "g");
      sanitized = sanitized.replace(regex, replacement);
    }
  }

  return sanitized;
}
