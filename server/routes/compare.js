import { Router } from "express";
import { z } from "zod";
import { ProblemSchema } from "../ai/schemas/problem.js";
import { StakeholderSchema } from "../ai/schemas/stakeholder.js";
import { PerspectiveSchema } from "../ai/schemas/perspective.js";
import { generateComparison } from "../services/comparisonEngine.js";

const router = Router();

const StakeholderListSchema = z.array(StakeholderSchema).min(1);
const PerspectiveListSchema = z.array(PerspectiveSchema).min(1);

/**
 * POST /api/compare
 * Analyzes generated stakeholder perspectives and surfaces shared goals, different priorities, potential tensions, and dependencies.
 */
router.post("/compare", async (req, res) => {
  try {
    // 1. Validate request payload structure
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Invalid request payload."
      });
    }

    const { problem, stakeholders, perspectives } = req.body;

    if (!problem || !stakeholders || !perspectives) {
      return res.status(400).json({
        error: "Fields 'problem', 'stakeholders', and 'perspectives' are all required."
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

    // 5. Invoke comparison engine service
    const comparison = await generateComparison(
      problemParse.data,
      stakeholdersParse.data,
      perspectivesParse.data
    );

    // 6. Return validated comparison
    return res.status(200).json({
      comparison
    });
  } catch (err) {
    console.error("[POST /api/compare error]:", err?.cause?.message || err?.message || err);

    return res.status(500).json({
      error: "An error occurred while generating perspective comparison. Please try again."
    });
  }
});

export default router;
