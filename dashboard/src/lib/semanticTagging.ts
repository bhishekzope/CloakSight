/**
 * CloakSight — Semantic Tagging & Vaulting Simulation
 *
 * Replaces detected PII entities with opaque, non-reversible tokens (TAG_001..006).
 * Maintains an in-memory vault mapping. Raw values are strictly isolated in memory
 * and are cleared immediately upon reset.
 */

import { DetectedEntity, SemanticTag } from "../types/cloaksight";

export function generateSemanticTags(entities: DetectedEntity[]): SemanticTag[] {
  return entities.map((entity, index) => {
    const tagId = `TAG_${(index + 1).toString().padStart(3, "0")}`;
    return {
      tagId,
      category: entity.category,
      semanticLabel: `[${entity.category}]`,
      sourceField: entity.sourceField,
      isVaultedLocally: true,
      maskedFormat: `[${entity.category}] (${tagId})`,
    };
  });
}

/**
 * In-memory vault simulator:
 * In a real extension, this is WeakMap / volatile RAM with TTL.
 * Never writes to localStorage, sessionStorage, or cookies.
 */
class InMemoryTagVault {
  private vault = new Map<string, string>();

  public store(tagId: string, rawValue: string): void {
    this.vault.set(tagId, rawValue);
  }

  public resolve(tagId: string): string | undefined {
    return this.vault.get(tagId);
  }

  public clear(): void {
    this.vault.clear();
  }

  public size(): number {
    return this.vault.size;
  }
}

export const inMemoryVault = new InMemoryTagVault();
