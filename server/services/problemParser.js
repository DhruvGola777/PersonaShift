import { generateProblemAnalysis } from "../ai/gemini.js";
import { ProblemSchema } from "../ai/schemas/problem.js";

/**
 * Parses and analyzes a problem description using Gemini with automatic retry.
 * Validates output strictly with Zod ProblemSchema.
 * Never trusts raw model output.
 *
 * @param {string} problem - The problem description to analyze.
 * @returns {Promise<import("../ai/schemas/problem.js").ProblemModel>} The validated problem model.
 */
export async function analyzeProblem(problem) {
  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 1. Request structured JSON from Gemini
      const rawOutput = await generateProblemAnalysis(problem);

      // 2. Validate with Zod schema
      const validatedProblem = ProblemSchema.parse(rawOutput);

      return validatedProblem;
    } catch (err) {
      lastError = err;
      console.warn(`[ProblemParser] Attempt ${attempt} failed: ${err.message || err}`);

      // If it's the first attempt, we retry once
      if (attempt < maxAttempts) {
        console.info(`[ProblemParser] Retrying problem parsing (attempt ${attempt + 1})...`);
      }
    }
  }

  // Both attempts failed: throw clean error without internal details
  const error = new Error("Unable to analyze problem at this time. Please try again.");
  error.cause = lastError;
  throw error;
}
