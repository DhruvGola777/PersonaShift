/**
 * System prompt for the PersonaShift Perspective Engine stage.
 */
export const PERSPECTIVE_ENGINE_SYSTEM_PROMPT = `You are the Perspective Engine for PersonaShift.

Your job is to construct a neutral map of possible factors that may shape each stakeholder's perspective on a decision.

You are NOT simulating a person.
You are NOT speaking for a stakeholder.
You are NOT determining what a stakeholder actually believes.
You are NOT generating recommendations.
You are NOT comparing stakeholders.

For each provided stakeholder:
- Generate possible goals (1 to 3 items).
- Generate possible concerns (1 to 3 items).
- Generate possible constraints (1 to 3 items).
- Generate possible incentives (1 to 3 items).
- Generate possible priorities (1 to 3 items).

Every item must have a basis:
- "fact"
- "inference"
- "unknown"

Rules:
1. Use "fact" ONLY when explicitly supported by the supplied problem facts or explicit user input.
2. Use "inference" for reasonable possibilities derived from the problem context.
3. Use "unknown" when information is genuinely unavailable (e.g. specific operational constraints).
4. Never present an AI inference as a fact.
5. Never invent stakeholder-specific facts, demographic details, political stances, emotional states, financial figures, or unverified opinions.
6. Never assume or claim that all members of a stakeholder group think or behave alike.
7. Use cautious, non-judgmental language for inferences: "may", "could", "might", "may prioritize", "could be concerned about", "may have an incentive to".
8. Avoid unsupported certainty (do not write "Students want..." or "Businesses will lose revenue...").
9. Do NOT use first-person roleplay (e.g., "I am a student...").
10. Do NOT create additional stakeholders beyond those provided.
11. Do NOT omit or remove any provided stakeholders.
12. Return exactly one perspective for every supplied stakeholder using their exact stakeholderId.
13. Return valid structured JSON matching the required schema.`;

/**
 * Builds the user prompt for the Perspective Engine.
 * Formats the ProblemModel and the confirmed stakeholders list.
 *
 * @param {object} problem - The structured ProblemModel.
 * @param {Array<object>} stakeholders - The confirmed stakeholders list.
 * @returns {string} Formatted prompt string.
 */
export function buildPerspectiveEnginePrompt(problem, stakeholders) {
  const stakeholderSummaries = stakeholders.map((s, idx) => (
    `${idx + 1}. ID: "${s.id}" | Name: "${s.name}" | Relevance: "${s.relevance}"
   Why affected: ${s.reason}`
  )).join("\n\n");

  const expectedIds = stakeholders.map(s => `"${s.id}"`).join(", ");

  return `Construct a structured perspective for each of the following confirmed stakeholders:

=== PROBLEM CONTEXT ===
Summary: ${problem.summary}
Decision: ${problem.decision}
Domain: ${problem.domain}

Explicit Facts:
${problem.facts && problem.facts.length > 0 ? problem.facts.map(f => `- ${f}`).join("\n") : "- None stated"}

Unknowns:
${problem.unknowns && problem.unknowns.length > 0 ? problem.unknowns.map(u => `- ${u}`).join("\n") : "- None stated"}

Assumptions:
${problem.assumptions && problem.assumptions.length > 0 ? problem.assumptions.map(a => `- ${a}`).join("\n") : "- None stated"}

Potentially Affected Areas:
${problem.affectedAreas && problem.affectedAreas.length > 0 ? problem.affectedAreas.map(area => `- ${area}`).join("\n") : "- None stated"}

=== CONFIRMED STAKEHOLDERS (${stakeholders.length} total) ===
${stakeholderSummaries}

CRITICAL INSTRUCTIONS:
- You must generate exactly ${stakeholders.length} perspectives.
- Each perspective's "stakeholderId" must match one of the exact IDs: [${expectedIds}].
- Do not add any new stakeholders or omit any of the ${stakeholders.length} listed above.
- Every item in goals, concerns, constraints, incentives, and priorities must include a valid "text" and "basis" ("fact", "inference", or "unknown").
- Use cautious, neutral phrasing ("may", "could", "might").`;
}
