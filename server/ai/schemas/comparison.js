import { z } from "zod";
import { Type } from "@google/genai";

/**
 * Zod schema for an area where stakeholder priorities may differ.
 */
export const DifferentPrioritySchema = z.object({
  topic: z.string().min(1),
  perspectiveA: z.string().min(1),
  perspectiveB: z.string().min(1),
  stakeholderAId: z.string().min(1).optional(),
  stakeholderBId: z.string().min(1).optional()
});

/**
 * Zod schema for a potential tension between stakeholder priorities.
 */
export const TensionSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  affectedPriorities: z.array(z.string().min(1)).min(1),
  stakeholderIds: z.array(z.string().min(1)).min(1).optional()
});

/**
 * Zod schema for a concrete dependency between stakeholders.
 */
export const DependencySchema = z.object({
  description: z.string().min(1),
  stakeholders: z.array(z.string().min(1)).min(2)
});

/**
 * Zod schema for the complete Comparison output.
 */
export const ComparisonSchema = z.object({
  sharedGoals: z.array(z.string().min(1)),
  differentPriorities: z.array(DifferentPrioritySchema),
  tensions: z.array(TensionSchema),
  dependencies: z.array(DependencySchema)
});

/**
 * Gemini responseSchema definition enforcing structured output matching ComparisonSchema.
 */
export const ComparisonGenAiSchema = {
  type: Type.OBJECT,
  properties: {
    sharedGoals: {
      type: Type.ARRAY,
      description: "Concise goals that appear meaningfully shared across two or more stakeholder perspectives (target 2-6). Use cautious language.",
      items: {
        type: Type.STRING
      }
    },
    differentPriorities: {
      type: Type.ARRAY,
      description: "Areas where stakeholder priorities may differ without ranking or declaring winners (target 2-6).",
      items: {
        type: Type.OBJECT,
        properties: {
          topic: {
            type: Type.STRING,
            description: "Concise title of the topic or priority area."
          },
          perspectiveA: {
            type: Type.STRING,
            description: "Perspective factor for first stakeholder using cautious language (e.g. 'Students: May prioritize schedule flexibility.')."
          },
          perspectiveB: {
            type: Type.STRING,
            description: "Perspective factor for second stakeholder using cautious language (e.g. 'Faculty: May prioritize consistent classroom engagement.')."
          },
          stakeholderAId: {
            type: Type.STRING,
            description: "Exact stakeholder ID for perspectiveA from the confirmed list."
          },
          stakeholderBId: {
            type: Type.STRING,
            description: "Exact stakeholder ID for perspectiveB from the confirmed list."
          }
        },
        required: ["topic", "perspectiveA", "perspectiveB"]
      }
    },
    tensions: {
      type: Type.ARRAY,
      description: "Situations where two or more priorities pull in different directions (target 1-5). Use cautious language ('may create tension').",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Concise title of the tension (e.g. 'Flexibility vs. attendance consistency')."
          },
          explanation: {
            type: Type.STRING,
            description: "Neutral, cautious explanation of how the priorities may interact."
          },
          affectedPriorities: {
            type: Type.ARRAY,
            description: "List of the specific priorities involved (e.g. ['student: scheduling flexibility', 'faculty: consistent engagement']).",
            items: {
              type: Type.STRING
            }
          },
          stakeholderIds: {
            type: Type.ARRAY,
            description: "List of exact stakeholder IDs involved in this tension.",
            items: {
              type: Type.STRING
            }
          }
        },
        required: ["title", "explanation", "affectedPriorities"]
      }
    },
    dependencies: {
      type: Type.ARRAY,
      description: "Concrete dependencies where one stakeholder's goals or concerns depend on another stakeholder or system (target 1-5).",
      items: {
        type: Type.OBJECT,
        properties: {
          description: {
            type: Type.STRING,
            description: "Description of the concrete dependency relationship using cautious language."
          },
          stakeholders: {
            type: Type.ARRAY,
            description: "Exact stakeholder IDs of the stakeholders involved (minimum 2).",
            items: {
              type: Type.STRING
            }
          }
        },
        required: ["description", "stakeholders"]
      }
    }
  },
  required: ["sharedGoals", "differentPriorities", "tensions", "dependencies"]
};
