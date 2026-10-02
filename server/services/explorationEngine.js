import { generateExplorationAnalysis } from "../ai/gemini.js";
import { ExplorationSchema } from "../ai/schemas/exploration.js";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "may", "could", "might", "would", "should", "shall",
  "will", "can", "their", "they", "them", "about", "that", "this", "these", "those",
  "such", "into", "over", "after", "before", "between", "under", "above"
]);

function extractSignificantTokens(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

/**
 * Checks whether an addressed concern is grounded in the stakeholder's perspective concerns.
 * Uses normalized token and stem matching to allow valid paraphrasing while rejecting invented concerns.
 */
export function isConcernGrounded(addressedText, perspective) {
  if (!addressedText || !perspective) return false;
  const addressedTokens = extractSignificantTokens(addressedText);
  if (addressedTokens.length === 0) return true;

  const concernTexts = (perspective.concerns || []).map((c) => c.text);
  const allConcernWords = extractSignificantTokens(concernTexts.join(" "));

  return addressedTokens.some((aToken) => {
    return allConcernWords.some((cToken) => {
      return (
        aToken === cToken ||
        (aToken.length >= 4 &&
          cToken.length >= 4 &&
          (aToken.startsWith(cToken.slice(0, 4)) || cToken.startsWith(aToken.slice(0, 4))))
      );
    });
  });
}

/**
 * Validates application-level invariants for generated exploration approaches:
 * - Every approach ID is non-empty and unique.
 * - Every stakeholderId referenced in addresses[] exists in confirmedStakeholders.
 * - Every stakeholderId referenced in tradeoffs[].affectedStakeholders[] exists in confirmedStakeholders.
 * - Addressed concerns are grounded in existing perspective concerns (not completely invented).
 * - No recommendation or ranking language is present in approaches.
 *
 * @param {object} exploration
 * @param {Array<object>} confirmedStakeholders
 * @param {Array<object>} perspectives
 * @throws {Error} if validation fails
 */
export function validateExplorationInvariants(exploration, confirmedStakeholders, perspectives) {
  if (!exploration || typeof exploration !== "object") {
    throw new Error("Exploration result must be an object.");
  }

  if (!Array.isArray(exploration.approaches) || exploration.approaches.length === 0) {
    throw new Error("Exploration must contain at least one approach.");
  }

  const confirmedIdSet = new Set(confirmedStakeholders.map((s) => s.id));
  const perspectiveMap = new Map();
  for (const p of perspectives) {
    perspectiveMap.set(p.stakeholderId, p);
  }

  const seenApproachIds = new Set();
  const prohibitedTerms = [
    "best approach",
    "optimal approach",
    "recommended approach",
    "winner",
    "loser",
    "you should choose",
    "ideal solution",
    "strongest option",
    "superior choice"
  ];

  for (const approach of exploration.approaches) {
    // 1. Approach ID uniqueness
    const id = approach.id?.trim();
    if (!id) {
      throw new Error("Approach missing valid id.");
    }
    if (seenApproachIds.has(id)) {
      throw new Error(`Duplicate approach ID detected: "${id}".`);
    }
    seenApproachIds.add(id);

    // 2. Check title and description
    if (!approach.title?.trim() || !approach.description?.trim()) {
      throw new Error(`Approach "${id}" must have non-empty title and description.`);
    }

    // Check for ranking / recommendation language
    const serialized = JSON.stringify(approach).toLowerCase();
    for (const term of prohibitedTerms) {
      if (serialized.includes(term)) {
        throw new Error(`Approach "${id}" contains prohibited recommendation/ranking language: "${term}".`);
      }
    }

    // 3. Validate addressed concerns & grounding
    if (!Array.isArray(approach.addresses)) {
      throw new Error(`Approach "${id}" addresses field must be an array.`);
    }
    for (const addr of approach.addresses) {
      const sId = addr.stakeholderId?.trim();
      if (!confirmedIdSet.has(sId)) {
        throw new Error(`Approach "${id}" addresses unknown stakeholder ID: "${addr.stakeholderId}".`);
      }

      const p = perspectiveMap.get(sId);
      if (!p) {
        throw new Error(`Approach "${id}" addresses stakeholder without perspective: "${sId}".`);
      }

      if (!addr.concern?.trim()) {
        throw new Error(`Approach "${id}" contains empty concern for stakeholder "${sId}".`);
      }

      // Grounding validation: verify addressed concern is traced to that stakeholder's concerns
      if (!isConcernGrounded(addr.concern, p)) {
        throw new Error(
          `Approach "${id}" addresses concern for "${sId}" that cannot be traced to that stakeholder's existing perspective concerns: "${addr.concern}".`
        );
      }
    }

    // 4. Validate trade-offs
    if (!Array.isArray(approach.tradeoffs)) {
      throw new Error(`Approach "${id}" tradeoffs field must be an array.`);
    }
    for (const tradeoff of approach.tradeoffs) {
      if (!tradeoff.description?.trim()) {
        throw new Error(`Approach "${id}" contains trade-off with empty description.`);
      }
      if (!Array.isArray(tradeoff.affectedStakeholders) || tradeoff.affectedStakeholders.length === 0) {
        throw new Error(`Approach "${id}" trade-off must list at least one affected stakeholder.`);
      }
      for (const affId of tradeoff.affectedStakeholders) {
        const trimmed = affId?.trim();
        if (!confirmedIdSet.has(trimmed)) {
          throw new Error(`Approach "${id}" trade-off references unknown stakeholder ID: "${affId}".`);
        }
      }
    }

    // 5. Validate implementation considerations
    if (!Array.isArray(approach.implementationConsiderations)) {
      throw new Error(`Approach "${id}" implementationConsiderations must be an array.`);
    }
  }
}

/**
 * Generates and validates alternative exploratory approaches grounded in perspectives and comparison.
 * Retries once if the model call or validation fails.
 *
 * @param {object} problemModel - The validated ProblemModel.
 * @param {Array<object>} confirmedStakeholders - List of confirmed stakeholders.
 * @param {Array<object>} perspectives - List of generated perspectives.
 * @param {object} comparison - The comparison analysis.
 * @returns {Promise<object>} The validated exploration object containing approaches.
 */
export async function generateExploration(problemModel, confirmedStakeholders, perspectives, comparison) {
  if (!Array.isArray(confirmedStakeholders) || confirmedStakeholders.length === 0) {
    throw new Error("Cannot generate exploration without confirmed stakeholders.");
  }
  if (!Array.isArray(perspectives) || perspectives.length === 0) {
    throw new Error("Cannot generate exploration without perspectives.");
  }

  // Safe default for empty comparison
  const safeComparison = comparison && typeof comparison === "object" ? comparison : {
    sharedGoals: [],
    differentPriorities: [],
    tensions: [],
    dependencies: []
  };

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Invoke Gemini abstraction
      const rawOutput = await generateExplorationAnalysis(
        problemModel,
        confirmedStakeholders,
        perspectives,
        safeComparison
      );

      if (!rawOutput || typeof rawOutput !== "object") {
        throw new Error("Model response was not an object.");
      }

      // 2. Schema validation with Zod
      const validated = ExplorationSchema.parse(rawOutput);

      // 3. Application-level invariant validation
      validateExplorationInvariants(validated, confirmedStakeholders, perspectives);

      return validated;
    } catch (err) {
      lastError = err;
      console.warn(
        `[ExplorationEngine] Attempt ${attempt}/${maxAttempts} failed: ${err.message}`
      );

      if (attempt < maxAttempts) {
        // Short pause before retry
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  const finalError = new Error(
    `Failed to generate valid exploration approaches after ${maxAttempts} attempts: ${lastError?.message}`
  );
  finalError.cause = lastError;
  throw finalError;
}
