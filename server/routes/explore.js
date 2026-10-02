import { Router } from "express";
import { z } from "zod";
import { ProblemSchema } from "../ai/schemas/problem.js";
import { StakeholderSchema } from "../ai/schemas/stakeholder.js";
import { PerspectiveSchema } from "../ai/schemas/perspective.js";
import { ComparisonSchema } from "../ai/schemas/comparison.js";
import { generateExploration } from "../services/explorationEngine.js";

const router = Router();

const StakeholderListSchema = z.array(StakeholderSchema).min(1);
const PerspectiveListSchema = z.array(PerspectiveSchema).min(1);

/**
 * POST /api/explore
 * Generates multiple plausible alternative approaches grounded in perspectives and comparison trade-offs.
 */
router.post("/explore", async (req, res) => {
  try {
    // 1. Validate request payload structure
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Invalid request payload."
      });
    }

    const { problem, stakeholders, perspectives, comparison } = req.body;

    if (!problem || !stakeholders || !perspectives || !comparison) {
      return res.status(400).json({
        error: "Fields 'problem', 'stakeholders', 'perspectives', and 'comparison' are all required."
      });
    }

    // 2. Validate problem model
    const problemParse = ProblemSchema.safeParse(problem);
    if (!problemParse.success) {
      return res.status(400).json({
        error: "Invalid or incomplete problem model provided."
      });
    }

    // 3. Validate confirmed stakeholders list
    const stakeholdersParse = StakeholderListSchema.safeParse(stakeholders);
    if (!stakeholdersParse.success) {
      return res.status(400).json({
        error: "Please provide a valid list of confirmed stakeholders."
      });
    }

    // 4. Validate perspectives list
    const perspectivesParse = PerspectiveListSchema.safeParse(perspectives);
    if (!perspectivesParse.success) {
      return res.status(400).json({
        error: "Please provide a valid list of generated perspectives."
      });
    }

    // 5. Validate comparison
    const comparisonParse = ComparisonSchema.safeParse(comparison);
    if (!comparisonParse.success) {
      return res.status(400).json({
        error: "Invalid comparison model provided."
      });
    }

    // 6. Invoke exploration engine service
    const exploration = await generateExploration(
      problemParse.data,
      stakeholdersParse.data,
      perspectivesParse.data,
      comparisonParse.data
    );

    // 7. Return validated exploration
    return res.status(200).json({
      exploration
    });
  } catch (err) {
    console.error("[POST /api/explore error]:", err?.cause?.message || err?.message || err);

    return res.status(500).json({
      error: "An error occurred while generating exploration approaches. Please try again."
    });
  }
});

export default router;
