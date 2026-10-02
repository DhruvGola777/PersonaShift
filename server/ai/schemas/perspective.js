import { z } from "zod";
import { Type } from "@google/genai";

/**
 * Zod schema for the basis of a perspective factor.
 * Must be 'fact', 'inference', or 'unknown'.
 */
export const BasisSchema = z.enum(["fact", "inference", "unknown"]);

/**
 * Zod schema for an individual factor item within a perspective category.
 */
export const PerspectiveItemSchema = z.object({
  text: z.string().min(1),
  basis: BasisSchema
});

/**
 * Zod schema for a complete stakeholder perspective.
 * Contains 1 to 3 items for each of the 5 categories.
 */
export const PerspectiveSchema = z.object({
  stakeholderId: z.string().min(1),

  goals: z.array(PerspectiveItemSchema).min(1).max(3),
  concerns: z.array(PerspectiveItemSchema).min(1).max(3),
  constraints: z.array(PerspectiveItemSchema).min(1).max(3),
  incentives: z.array(PerspectiveItemSchema).min(1).max(3),
  priorities: z.array(PerspectiveItemSchema).min(1).max(3)
});

/**
 * Zod schema for the collection of generated perspectives.
 */
export const PerspectivesSchema = z.object({
  perspectives: z.array(PerspectiveSchema).min(1)
});

/**
 * Gemini responseSchema definition enforcing structured output matching PerspectivesSchema.
 */
export const PerspectivesGenAiSchema = {
  type: Type.OBJECT,
  properties: {
    perspectives: {
      type: Type.ARRAY,
      description: "List of perspectives, exactly one for each supplied stakeholder.",
      items: {
        type: Type.OBJECT,
        properties: {
          stakeholderId: {
            type: Type.STRING,
            description: "The exact matching stakeholderId from the input stakeholder list."
          },
          goals: {
            type: Type.ARRAY,
            description: "1 to 3 potential outcomes that may matter to the stakeholder.",
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "Description using cautious wording (e.g. 'May prioritize...')."
                },
                basis: {
                  type: Type.STRING,
                  enum: ["fact", "inference", "unknown"],
                  description: "'fact' (explicitly stated in problem facts), 'inference' (reasonable contextual possibility), or 'unknown' (information genuinely unavailable)."
                }
              },
              required: ["text", "basis"]
            }
          },
          concerns: {
            type: Type.ARRAY,
            description: "1 to 3 potential risks or downsides for the stakeholder.",
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "Description using cautious wording (e.g. 'Could be concerned about...')."
                },
                basis: {
                  type: Type.STRING,
                  enum: ["fact", "inference", "unknown"],
                  description: "'fact', 'inference', or 'unknown'."
                }
              },
              required: ["text", "basis"]
            }
          },
          constraints: {
            type: Type.ARRAY,
            description: "1 to 3 conditions or limitations affecting the stakeholder.",
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "Limitation description, or explicitly stated as unknown if genuinely unavailable."
                },
                basis: {
                  type: Type.STRING,
                  enum: ["fact", "inference", "unknown"],
                  description: "'fact', 'inference', or 'unknown'."
                }
              },
              required: ["text", "basis"]
            }
          },
          incentives: {
            type: Type.ARRAY,
            description: "1 to 3 factors that could shape the stakeholder's behavior or position.",
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "Description using cautious wording (e.g. 'May have an incentive to...')."
                },
                basis: {
                  type: Type.STRING,
                  enum: ["fact", "inference", "unknown"],
                  description: "'fact', 'inference', or 'unknown'."
                }
              },
              required: ["text", "basis"]
            }
          },
          priorities: {
            type: Type.ARRAY,
            description: "1 to 3 factors the stakeholder may prioritize when evaluating the decision.",
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "Description using cautious wording (e.g. 'May prioritize...')."
                },
                basis: {
                  type: Type.STRING,
                  enum: ["fact", "inference", "unknown"],
                  description: "'fact', 'inference', or 'unknown'."
                }
              },
              required: ["text", "basis"]
            }
          }
        },
        required: [
          "stakeholderId",
          "goals",
          "concerns",
          "constraints",
          "incentives",
          "priorities"
        ]
      }
    }
  },
  required: ["perspectives"]
};
