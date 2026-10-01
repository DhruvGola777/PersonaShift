import { generateStakeholderAnalysis } from "../ai/gemini.js";
import { StakeholdersSchema } from "../ai/schemas/stakeholder.js";

/**
 * Validates application-level invariants for stakeholders:
 * - Maximum 8 stakeholders
 * - No duplicate IDs
 * - No duplicate names (case-insensitive normalized)
 * - Non-empty names and reasons
 * - Valid relevance values
 *
 * @param {Array<object>} stakeholders
 * @throws {Error} if validation fails
 */
function validateStakeholderInvariants(stakeholders) {
  if (!Array.isArray(stakeholders) || stakeholders.length === 0) {
    throw new Error("At least one stakeholder is required.");
  }

  if (stakeholders.length > 8) {
    throw new Error("Stakeholder count cannot exceed 8.");
  }

  const seenIds = new Set();
  const seenNames = new Set();

  for (const s of stakeholders) {
    const id = s.id?.trim();
    const name = s.name?.trim();
    const reason = s.reason?.trim();

    if (!id) {
      throw new Error("Stakeholder id cannot be empty.");
    }
    if (!name) {
      throw new Error("Stakeholder name cannot be empty.");
    }
    if (!reason) {
      throw new Error("Stakeholder reason cannot be empty.");
    }

    if (!["direct", "indirect", "system"].includes(s.relevance)) {
      throw new Error(`Invalid relevance value '${s.relevance}'.`);
    }

    const normalizedId = id.toLowerCase();
    if (seenIds.has(normalizedId)) {
      throw new Error(`Duplicate stakeholder ID found: '${id}'.`);
    }
    seenIds.add(normalizedId);

    const normalizedName = name.toLowerCase();
    if (seenNames.has(normalizedName)) {
      throw new Error(`Duplicate stakeholder name found: '${name}'.`);
    }
    seenNames.add(normalizedName);
  }
}

/**
 * Discovers and validates stakeholders for a given ProblemModel using Gemini.
 * Retries once if the model call or validation fails.
 *
 * @param {object} problemModel - The structured ProblemModel.
 * @returns {Promise<Array<object>>} List of validated AI stakeholders.
 */
export async function discoverStakeholders(problemModel) {
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Request structured JSON from Gemini
      const rawOutput = await generateStakeholderAnalysis(problemModel);

      if (!rawOutput || !Array.isArray(rawOutput.stakeholders)) {
        throw new Error("Model response did not contain a stakeholders array.");
      }

      // 2. Ensure each stakeholder has source = "ai" and clean fields
      const enrichedStakeholders = rawOutput.stakeholders.map((s, idx) => ({
        id: s.id?.trim() || `stakeholder-${idx + 1}`,
        name: s.name?.trim() || "",
        reason: s.reason?.trim() || "",
        relevance: s.relevance,
        source: "ai"
      }));

      // 3. Schema validation with Zod
      const validated = StakeholdersSchema.parse({
        stakeholders: enrichedStakeholders
      });

      // 4. Application-level invariant validation
      validateStakeholderInvariants(validated.stakeholders);

      return validated.stakeholders;
    } catch (err) {
      lastError = err;
      console.warn(`[StakeholderEngine] Attempt ${attempt} failed: ${err.message || err}`);

      if (attempt < maxAttempts) {
        console.info(`[StakeholderEngine] Retrying stakeholder discovery (attempt ${attempt + 1})...`);
      }
    }
  }

  const error = new Error("Unable to identify stakeholders at this time. Please try again.");
  error.cause = lastError;
  throw error;
}
