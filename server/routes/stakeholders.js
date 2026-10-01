import { Router } from "express";
import { ProblemSchema } from "../ai/schemas/problem.js";
import { discoverStakeholders } from "../services/stakeholderEngine.js";

const router = Router();

/**
 * POST /api/stakeholders
 * Discovers and returns 4-8 structured stakeholders based on a validated ProblemModel.
 */
router.post("/stakeholders", async (req, res) => {
  try {
    // 1. Validate request payload structure
    if (!req.body || typeof req.body !== "object" || !req.body.problem) {
      return res.status(400).json({
        error: "Please provide a valid problem model."
      });
    }

    // 2. Validate problem model with ProblemSchema
    const parseResult = ProblemSchema.safeParse(req.body.problem);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Invalid or incomplete problem model provided."
      });
    }

    // 3. Invoke stakeholder engine service
    const stakeholders = await discoverStakeholders(parseResult.data);

    // 4. Return validated stakeholders
    return res.status(200).json({
      stakeholders
    });
  } catch (err) {
    console.error("[POST /api/stakeholders error]:", err?.cause?.message || err?.message || err);

    return res.status(500).json({
      error: "An error occurred while discovering stakeholders. Please try again."
    });
  }
});

export default router;
