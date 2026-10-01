import { Router } from "express";
import { analyzeProblem } from "../services/problemParser.js";

const router = Router();

/**
 * POST /api/analyze
 * Analyzes a user-provided problem description and returns a structured ProblemModel.
 */
router.post("/analyze", async (req, res) => {
  try {
    // 1. Validate request body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Invalid request payload."
      });
    }

    const { problem } = req.body;

    if (!problem || typeof problem !== "string" || problem.trim().length === 0) {
      return res.status(400).json({
        error: "Please provide a problem description."
      });
    }

    // 2. Call service layer (handles AI call, structured validation, and retries)
    const problemModel = await analyzeProblem(problem.trim());

    // 3. Return structured response
    return res.status(200).json({
      problem: problemModel
    });
  } catch (err) {
    // Log server-side for observability, but NEVER expose internal error details to client
    console.error("[POST /api/analyze error]:", err?.cause?.message || err?.message || err);

    return res.status(500).json({
      error: "An error occurred while analyzing the problem. Please try again."
    });
  }
});

export default router;
