import { z } from "zod";
import { Type } from "@google/genai";

/**
 * Zod validation schema for ProblemModel.
 * Ensures the structured output from Gemini matches PersonaShift's expected format.
 * Never trust raw model output.
 */
export const ProblemSchema = z.object({
  summary: z.string().min(1),
  decision: z.string().min(1),
  domain: z.string().min(1),

  facts: z.array(z.string()),
  unknowns: z.array(z.string()),
  assumptions: z.array(z.string()),

  affectedAreas: z.array(z.string())
});

/**
 * Structured schema supplied to Gemini's responseSchema configuration.
 * Enforces strict JSON matching ProblemSchema at the model generation level.
 */
export const ProblemGenAiSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise, neutral summary of the situation."
    },
    decision: {
      type: Type.STRING,
      description: "The decision, change, or question being considered."
    },
    domain: {
      type: Type.STRING,
      description: "Broad domain of the problem (e.g., education, technology, urban planning, commerce)."
    },
    facts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Information explicitly stated by the user."
    },
    unknowns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Important information that is missing but could affect the analysis."
    },
    assumptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Reasonable interpretations or implications that are not explicitly confirmed."
    },
    affectedAreas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Broad areas that could potentially be affected."
    }
  },
  required: [
    "summary",
    "decision",
    "domain",
    "facts",
    "unknowns",
    "assumptions",
    "affectedAreas"
  ]
};
