import { generateComparisonAnalysis } from "../ai/gemini.js";
import { ComparisonSchema } from "../ai/schemas/comparison.js";

/**
 * Validates application-level invariants for generated comparison:
 * - Every stakeholder ID referenced in dependencies.stakeholders must exist in confirmedStakeholders.
 * - Every stakeholder ID referenced in differentPriorities (if provided) must exist in confirmedStakeholders.
 * - Every stakeholder ID referenced in tensions.stakeholderIds (if provided) must exist in confirmedStakeholders.
 * - No dependencies with fewer than 2 stakeholders.
 * - No references to stakeholders lacking perspectives.
 *
 * @param {object} comparison
 * @param {Array<object>} confirmedStakeholders
 * @param {Array<object>} perspectives
 * @throws {Error} if validation fails
 */
export function validateComparisonInvariants(comparison, confirmedStakeholders, perspectives) {
  if (!comparison || typeof comparison !== "object") {
    throw new Error("Comparison result must be an object.");
  }

  const confirmedIdSet = new Set(confirmedStakeholders.map((s) => s.id));
  const perspectiveIdSet = new Set(perspectives.map((p) => p.stakeholderId));

  // 1. Validate dependencies
  if (Array.isArray(comparison.dependencies)) {
    for (const dep of comparison.dependencies) {
      if (!Array.isArray(dep.stakeholders) || dep.stakeholders.length < 2) {
        throw new Error("Dependency must reference at least two stakeholders.");
      }
      for (const sId of dep.stakeholders) {
        const trimmed = sId?.trim();
        if (!confirmedIdSet.has(trimmed)) {
          throw new Error(`Dependency references unknown stakeholder ID: "${sId}".`);
        }
        if (!perspectiveIdSet.has(trimmed)) {
          throw new Error(`Dependency references stakeholder with missing perspective: "${sId}".`);
        }
      }
    }
  }

  // 2. Validate different priorities
  if (Array.isArray(comparison.differentPriorities)) {
    for (const dp of comparison.differentPriorities) {
      if (dp.stakeholderAId && !confirmedIdSet.has(dp.stakeholderAId.trim())) {
        throw new Error(`DifferentPriority references unknown stakeholderAId: "${dp.stakeholderAId}".`);
      }
      if (dp.stakeholderBId && !confirmedIdSet.has(dp.stakeholderBId.trim())) {
        throw new Error(`DifferentPriority references unknown stakeholderBId: "${dp.stakeholderBId}".`);
      }
      if (dp.stakeholderAId && !perspectiveIdSet.has(dp.stakeholderAId.trim())) {
        throw new Error(`DifferentPriority references stakeholder with missing perspective: "${dp.stakeholderAId}".`);
      }
      if (dp.stakeholderBId && !perspectiveIdSet.has(dp.stakeholderBId.trim())) {
        throw new Error(`DifferentPriority references stakeholder with missing perspective: "${dp.stakeholderBId}".`);
      }
    }
  }

  // 3. Validate tensions
  if (Array.isArray(comparison.tensions)) {
    for (const tension of comparison.tensions) {
      if (Array.isArray(tension.stakeholderIds)) {
        for (const sId of tension.stakeholderIds) {
          const trimmed = sId?.trim();
          if (!confirmedIdSet.has(trimmed)) {
            throw new Error(`Tension references unknown stakeholder ID: "${sId}".`);
          }
          if (!perspectiveIdSet.has(trimmed)) {
            throw new Error(`Tension references stakeholder with missing perspective: "${sId}".`);
          }
        }
      }
    }
  }
}

/**
 * Generates and validates perspective comparison for the confirmed stakeholder perspectives.
 * Retries once if the model call or validation fails.
 *
 * @param {object} problemModel - The validated ProblemModel.
 * @param {Array<object>} confirmedStakeholders - List of confirmed stakeholders.
 * @param {Array<object>} perspectives - List of generated perspectives.
 * @returns {Promise<object>} The validated comparison object.
 */
export async function generateComparison(problemModel, confirmedStakeholders, perspectives) {
  if (!Array.isArray(confirmedStakeholders) || confirmedStakeholders.length === 0) {
    throw new Error("Cannot generate comparison without confirmed stakeholders.");
  }
  if (!Array.isArray(perspectives) || perspectives.length === 0) {
    throw new Error("Cannot generate comparison without perspectives.");
  }

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Invoke Gemini abstraction
      const rawOutput = await generateComparisonAnalysis(
        problemModel,
        confirmedStakeholders,
        perspectives
      );

      if (!rawOutput || typeof rawOutput !== "object") {
        throw new Error("Model response was not an object.");
      }

      // Ensure array defaults if omitted
      const sanitized = {
        sharedGoals: Array.isArray(rawOutput.sharedGoals) ? rawOutput.sharedGoals : [],
        differentPriorities: Array.isArray(rawOutput.differentPriorities) ? rawOutput.differentPriorities : [],
        tensions: Array.isArray(rawOutput.tensions) ? rawOutput.tensions : [],
        dependencies: Array.isArray(rawOutput.dependencies) ? rawOutput.dependencies : []
      };

      // 2. Schema validation with Zod
      const validated = ComparisonSchema.parse(sanitized);

      // 3. Application-level invariant validation
      validateComparisonInvariants(validated, confirmedStakeholders, perspectives);

      return validated;
    } catch (err) {
      lastError = err;
      console.warn(
        `[ComparisonEngine] Attempt ${attempt}/${maxAttempts} failed: ${err.message}`
      );

      if (attempt < maxAttempts) {
        // Short pause before retry
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  const finalError = new Error(
    `Failed to generate valid perspective comparison after ${maxAttempts} attempts: ${lastError?.message}`
  );
  finalError.cause = lastError;
  throw finalError;
}
