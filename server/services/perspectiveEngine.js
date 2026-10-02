import { generatePerspectivesAnalysis } from "../ai/gemini.js";
import { PerspectivesSchema } from "../ai/schemas/perspective.js";

/**
 * Validates application-level invariants for generated perspectives:
 * - Number of perspectives must exactly equal number of confirmed stakeholders.
 * - No duplicate stakeholder IDs.
 * - No missing stakeholder IDs from the confirmed set.
 * - No unexpected/extra stakeholder IDs.
 * - Each perspective item has non-empty text and valid basis.
 *
 * @param {Array<object>} perspectives
 * @param {Array<object>} confirmedStakeholders
 * @throws {Error} if validation fails
 */
function validatePerspectiveInvariants(perspectives, confirmedStakeholders) {
  if (!Array.isArray(perspectives) || perspectives.length === 0) {
    throw new Error("Perspectives list cannot be empty.");
  }

  if (perspectives.length !== confirmedStakeholders.length) {
    throw new Error(
      `Perspective count mismatch: received ${perspectives.length}, expected ${confirmedStakeholders.length}.`
    );
  }

  const confirmedIdSet = new Set(confirmedStakeholders.map((s) => s.id));
  const seenPerspectiveIds = new Set();

  for (const p of perspectives) {
    const id = p.stakeholderId?.trim();
    if (!id) {
      throw new Error("Perspective missing stakeholderId.");
    }

    if (seenPerspectiveIds.has(id)) {
      throw new Error(`Duplicate stakeholderId in perspectives: "${id}".`);
    }
    seenPerspectiveIds.add(id);

    if (!confirmedIdSet.has(id)) {
      throw new Error(`Unexpected stakeholderId in perspectives: "${id}".`);
    }

    const categories = ["goals", "concerns", "constraints", "incentives", "priorities"];
    for (const cat of categories) {
      const items = p[cat];
      if (!Array.isArray(items) || items.length < 1 || items.length > 3) {
        throw new Error(
          `Category "${cat}" for stakeholder "${id}" must contain between 1 and 3 items.`
        );
      }
      for (const item of items) {
        if (!item.text || typeof item.text !== "string" || item.text.trim().length === 0) {
          throw new Error(`Empty text in category "${cat}" for stakeholder "${id}".`);
        }
        if (!["fact", "inference", "unknown"].includes(item.basis)) {
          throw new Error(`Invalid basis "${item.basis}" in category "${cat}" for stakeholder "${id}".`);
        }
      }
    }
  }

  for (const expectedId of confirmedIdSet) {
    if (!seenPerspectiveIds.has(expectedId)) {
      throw new Error(`Missing perspective for confirmed stakeholderId: "${expectedId}".`);
    }
  }
}

/**
 * Generates and validates perspectives for each confirmed stakeholder using Gemini.
 * Retries once if the model call or validation fails.
 *
 * @param {object} problemModel - The structured ProblemModel.
 * @param {Array<object>} confirmedStakeholders - The final confirmed stakeholders list.
 * @returns {Promise<Array<object>>} List of validated perspectives.
 */
export async function generatePerspectives(problemModel, confirmedStakeholders) {
  if (!Array.isArray(confirmedStakeholders) || confirmedStakeholders.length === 0) {
    throw new Error("Cannot generate perspectives without at least one confirmed stakeholder.");
  }

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Request structured JSON from Gemini
      const rawOutput = await generatePerspectivesAnalysis(problemModel, confirmedStakeholders);

      if (!rawOutput || !Array.isArray(rawOutput.perspectives)) {
        throw new Error("Model response did not contain a perspectives array.");
      }

      // 2. Schema validation with Zod
      const validated = PerspectivesSchema.parse(rawOutput);

      // 3. Strict application-level invariant validation
      validatePerspectiveInvariants(validated.perspectives, confirmedStakeholders);

      return validated.perspectives;
    } catch (err) {
      lastError = err;
      console.warn(`[PerspectiveEngine] Attempt ${attempt} failed: ${err.message || err}`);

      if (attempt < maxAttempts) {
        console.info(`[PerspectiveEngine] Retrying perspective generation (attempt ${attempt + 1})...`);
      }
    }
  }

  const error = new Error("Unable to generate perspectives at this time. Please try again.");
  error.cause = lastError;
  throw error;
}
