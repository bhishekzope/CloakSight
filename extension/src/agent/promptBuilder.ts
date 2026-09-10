/**
 * CloakSight — Prompt Builder
 *
 * Constructs prompts and message payloads for AI agents (Ollama, Gemini, OpenAI).
 * Formats sanitized page elements and user task directives into structured,
 * schema-constrained prompts that require tag-based ActionPlan JSON responses.
 *
 * PRIVACY GUARANTEE:
 * Operates purely on SanitizedContext. No raw PII is ever embedded into prompts.
 */

import type { AgentRequest } from "../types/context";

// ============================================================
// System Prompt
// ============================================================

export const CLOAKSIGHT_SYSTEM_PROMPT = `You are CloakSight Agent, an intelligent web browser automation assistant.
Your job is to analyze the user's task and a sanitized page representation, and return a step-by-step action plan to accomplish the task.

CRITICAL PRIVACY RULES:
1. All private personal information on this page has been sanitized into opaque semantic tags (e.g., "TAG_001", "TAG_002") or semantic placeholders (e.g., "[PERSON_NAME]").
2. In your action plan, every action's "target" MUST reference elements ONLY by their exact "tagId" (e.g., "TAG_001"). Never invent selectors, IDs, or element names.
3. In "value" fields for inputs, NEVER invent sensitive real-world PII. If an input corresponds to a tagged entity, reference the intent or non-sensitive value.
4. If an action performs an irreversible or sensitive operation (like clicking "Submit", "Pay", "Delete"), set "requiresConfirmation": true.

OUTPUT FORMAT:
You MUST respond with a single valid JSON object strictly matching this schema with NO markdown formatting, no backticks, and no extra commentary:
{
  "planId": "plan_<unique_id>",
  "actions": [
    {
      "actionId": "act_1",
      "type": "click" | "fill" | "select" | "check" | "uncheck" | "scroll" | "submit" | "wait",
      "target": {
        "tagId": "TAG_001",
        "expectedLabel": "Label or description of element"
      },
      "value": "string value if fill/select, otherwise omit",
      "description": "Human readable explanation of this step",
      "requiresConfirmation": false,
      "sequenceNumber": 1
    }
  ],
  "summary": "Brief 1-2 sentence overview of what this plan does",
  "confidence": 0.95
}`;

// ============================================================
// User Prompt Construction
// ============================================================

/**
 * Builds the user prompt containing task instructions and the sanitized element catalog.
 */
export function buildUserPrompt(request: AgentRequest): string {
  const { task, sanitizedContext } = request;
  const { pageMetadata, elements } = sanitizedContext;

  const lines: string[] = [];

  lines.push(`TASK: "${task}"`);
  lines.push(`PAGE: ${pageMetadata.pageTitle} (${pageMetadata.pageUrl})`);
  lines.push(`TOTAL ELEMENTS: ${elements.length}`);
  lines.push("");
  lines.push("AVAILABLE PAGE ELEMENTS:");

  for (const el of elements) {
    const parts: string[] = [];
    parts.push(`Tag: [${el.tagId}]`);
    parts.push(`Type: <${el.elementType}>`);

    if (el.semanticLabel) {
      parts.push(`Label: "${el.semanticLabel}"`);
    }
    if (el.elementRole) {
      parts.push(`Role: ${el.elementRole}`);
    }
    if (el.currentValue) {
      parts.push(`Value: "${el.currentValue}"`);
    }
    if (el.isSensitive) {
      parts.push(`(Sensitive: ${el.semanticLabel})`);
    }
    if (el.isInteractive) {
      parts.push(`[Interactive]`);
    }

    lines.push(`- ${parts.join(" | ")}`);
  }

  lines.push("");
  lines.push("Generate the structured JSON ActionPlan to complete the user task.");

  return lines.join("\n");
}

/**
 * Builds chat messages payload in the format expected by Ollama / OpenAI / Claude.
 */
export function buildChatMessages(request: AgentRequest): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content: CLOAKSIGHT_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: buildUserPrompt(request),
    },
  ];
}
