import { z } from "zod";
import { Type } from "@google/genai";

/**
 * Zod schema for an addressed stakeholder concern.
 */
export const AddressedConcernSchema = z.object({
  stakeholderId: z.string().min(1),
  concern: z.string().min(1)
});

/**
 * Zod schema for a trade-off associated with an approach.
 */
export const TradeoffSchema = z.object({
  description: z.string().min(1),
  affectedStakeholders: z.array(z.string().min(1)).min(1)
});

/**
 * Zod schema for an individual exploratory approach.
 */
export const ApproachSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  addresses: z.array(AddressedConcernSchema),
  tradeoffs: z.array(TradeoffSchema),
  implementationConsiderations: z.array(z.string().min(1))
});

/**
 * Zod schema for the complete Exploration output.
 * Contains between 1 and 6 alternative approaches.
 */
export const ExplorationSchema = z.object({
  approaches: z.array(ApproachSchema).min(1).max(6)
});

/**
 * Gemini responseSchema definition enforcing structured output matching ExplorationSchema.
 */
export const ExplorationGenAiSchema = {
  type: Type.OBJECT,
  properties: {
    approaches: {
      type: Type.ARRAY,
      description: "List of 3 to 5 meaningfully different alternative approaches for exploring the decision. Must not rank or declare winners.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique kebab-case approach identifier (e.g. 'phased-implementation', 'pilot-rollout')."
          },
          title: {
            type: Type.STRING,
            description: "Concise title characterizing this approach (e.g. 'Phased Departmental Rollout with Flexibility Safeguards')."
          },
          description: {
            type: Type.STRING,
            description: "Clear explanation of how this approach operates and what it involves."
          },
          addresses: {
            type: Type.ARRAY,
            description: "List of concerns from the existing perspectives that this approach seeks to address.",
            items: {
              type: Type.OBJECT,
              properties: {
                stakeholderId: {
                  type: Type.STRING,
                  description: "Exact stakeholder ID from the confirmed stakeholder list whose concern is addressed."
                },
                concern: {
                  type: Type.STRING,
                  description: "The specific concern being addressed, grounded directly in that stakeholder's existing perspective concerns."
                }
              },
              required: ["stakeholderId", "concern"]
            }
          },
          tradeoffs: {
            type: Type.ARRAY,
            description: "Surfaced trade-offs or tensions created by this approach. Must use cautious phrasing.",
            items: {
              type: Type.OBJECT,
              properties: {
                description: {
                  type: Type.STRING,
                  description: "Cautious description of consequences or potential downsides (e.g. 'May require additional coordination across departments.')."
                },
                affectedStakeholders: {
                  type: Type.ARRAY,
                  description: "Exact stakeholder IDs of the stakeholders affected by this trade-off.",
                  items: {
                    type: Type.STRING
                  }
                }
              },
              required: ["description", "affectedStakeholders"]
            }
          },
          implementationConsiderations: {
            type: Type.ARRAY,
            description: "Practical operational, timing, or technical considerations for exploring this approach.",
            items: {
              type: Type.STRING
            }
          }
        },
        required: ["id", "title", "description", "addresses", "tradeoffs", "implementationConsiderations"]
      }
    }
  },
  required: ["approaches"]
};
