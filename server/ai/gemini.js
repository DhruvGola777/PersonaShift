import { GoogleGenAI } from "@google/genai";
import { PROBLEM_PARSER_SYSTEM_PROMPT, buildProblemParserPrompt } from "./prompts/problemParser.js";
import { ProblemGenAiSchema } from "./schemas/problem.js";
import { STAKEHOLDER_ENGINE_SYSTEM_PROMPT, buildStakeholderEnginePrompt } from "./prompts/stakeholderEngine.js";
import { StakeholdersGenAiSchema } from "./schemas/stakeholder.js";
import { PERSPECTIVE_ENGINE_SYSTEM_PROMPT, buildPerspectiveEnginePrompt } from "./prompts/perspectiveEngine.js";
import { PerspectivesGenAiSchema } from "./schemas/perspective.js";

// Single place where the model identifier is configured for the project
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

/**
 * Returns an instance of GoogleGenAI using the GEMINI_API_KEY environment variable.
 * @returns {GoogleGenAI}
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY environment variable is not set.");
    error.code = "API_KEY_MISSING";
    throw error;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Invokes Gemini with structured JSON output configured to match the ProblemSchema.
 * @param {string} problem - The raw problem text from the user.
 * @returns {Promise<object>} The raw JSON object parsed from model output.
 */
export async function generateProblemAnalysis(problem) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildProblemParserPrompt(problem),
    config: {
      systemInstruction: PROBLEM_PARSER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: ProblemGenAiSchema
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No text content returned from Gemini model.");
  }

  try {
    return JSON.parse(responseText);
  } catch (err) {
    const parseError = new Error("Model response was not valid JSON.");
    parseError.code = "INVALID_JSON";
    throw parseError;
  }
}

/**
 * Invokes Gemini with structured JSON output configured to match the StakeholdersSchema.
 * @param {object} problemModel - The structured ProblemModel.
 * @returns {Promise<object>} The raw JSON object parsed from model output.
 */
export async function generateStakeholderAnalysis(problemModel) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildStakeholderEnginePrompt(problemModel),
    config: {
      systemInstruction: STAKEHOLDER_ENGINE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: StakeholdersGenAiSchema
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No text content returned from Gemini model.");
  }

  try {
    return JSON.parse(responseText);
  } catch (err) {
    const parseError = new Error("Model response was not valid JSON.");
    parseError.code = "INVALID_JSON";
    throw parseError;
  }
}

/**
 * Invokes Gemini with structured JSON output configured to match the PerspectivesSchema.
 * @param {object} problemModel - The structured ProblemModel.
 * @param {Array<object>} stakeholders - The confirmed stakeholders list.
 * @returns {Promise<object>} The raw JSON object parsed from model output.
 */
export async function generatePerspectivesAnalysis(problemModel, stakeholders) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPerspectiveEnginePrompt(problemModel, stakeholders),
    config: {
      systemInstruction: PERSPECTIVE_ENGINE_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: PerspectivesGenAiSchema
    }
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No text content returned from Gemini model.");
  }

  try {
    return JSON.parse(responseText);
  } catch (err) {
    const parseError = new Error("Model response was not valid JSON.");
    parseError.code = "INVALID_JSON";
    throw parseError;
  }
}
