import { z } from "zod";
import { Type } from "@google/genai";

/**
 * Zod schema for an individual Stakeholder.
 */
export const StakeholderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  reason: z.string().min(1),
  relevance: z.enum(["direct", "indirect", "system"]),
  source: z.enum(["ai", "user"]).optional()
});

/**
 * Zod schema for the collection of Stakeholders.
 * Enforces between 1 and 8 stakeholders.
 */
export const StakeholdersSchema = z.object({
  stakeholders: z.array(StakeholderSchema).min(1).max(8)
});

/**
 * Schema supplied to Gemini's responseSchema to enforce structured output.
 */
export const StakeholdersGenAiSchema = {
  type: Type.OBJECT,
  properties: {
    stakeholders: {
      type: Type.ARRAY,
      description: "List of 4 to 8 high-value stakeholders affected by the problem.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "A concise, unique slug or identifier (e.g., 'students', 'it-operations')."
          },
          name: {
            type: Type.STRING,
            description: "A clear, broad stakeholder label (e.g., 'Undergraduate Students')."
          },
          reason: {
            type: Type.STRING,
            description: "Objective explanation of why this stakeholder could be affected. Must NOT claim what they believe or want."
          },
          relevance: {
            type: Type.STRING,
            enum: ["direct", "indirect", "system"],
            description: "'direct' (experiences effects directly), 'indirect' (secondary/downstream), or 'system' (operates, regulates, funds, maintains)."
          }
        },
        required: ["id", "name", "reason", "relevance"]
      }
    }
  },
  required: ["stakeholders"]
};
