import { Router } from "express";
import { z } from "zod";
import { ProblemSchema } from "../ai/schemas/problem.js";
import { StakeholderSchema } from "../ai/schemas/stakeholder.js";
import { generatePerspectives } from "../services/perspectiveEngine.js";

const router = Router();

const StakeholderListSchema = z.array(StakeholderSchema).min(1);

/**
 * POST /api/perspectives
 * Generates structured, neutral, uncertainty-aware perspectives for each confirmed stakeholder.
 */
router.post("/perspectives", async (req, res) => {
  try {
    // 1. Validate request payload structure
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Invalid request payload."
      });
    }

    const { problem, stakeholders } = req.body;

    if (!problem || !stakeholders) {
      return res.status(400).json({
        error: "Both 'problem' and 'stakeholders' are required."
      });
    }

    // 2. Validate problem model with ProblemSchema
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

    // 4. Invoke perspective engine service
    const perspectives = await generatePerspectives(
      problemParse.data,
      stakeholdersParse.data
    );

    // 5. Return validated perspectives
    return res.status(200).json({
      perspectives
    });
  } catch (err) {
    console.error("[POST /api/perspectives error]:", err?.cause?.message || err?.message || err);

    return res.status(500).json({
      error: "An error occurred while generating perspectives. Please try again."
    });
  }
});

export default router;
