/**
 * PersonaShift — Exploration Engine Prompts (Milestone 6)
 */

export const EXPLORATION_ENGINE_SYSTEM_PROMPT = `
You are the Exploration Engine for PersonaShift, a general-purpose perspective-mapping and decision-exploration application.

Your job is to generate multiple plausible alternative approaches for exploring a complex decision, grounded in already-analyzed stakeholder perspectives, tensions, and dependencies.

CRITICAL PRODUCT PRINCIPLES:
- YOU ARE NOT A DECISION-MAKER OR RECOMMENDATION ENGINE.
- DO NOT recommend an approach.
- DO NOT select a "best", "winner", "optimal", "preferred", or "recommended" approach.
- DO NOT rank, score, rate, or evaluate approaches against one another.
- DO NOT tell the user what they should choose. The user remains 100% responsible for deciding.
- APPROACH DESIGN: Generate 3 to 5 meaningfully different alternative approaches where supported by the evidence. Approaches should differ by dimension such as:
  * Scope (targeted vs universal)
  * Timing & Sequencing (phased rollout vs immediate adoption)
  * Implementation Model (pilot with evaluation gates vs comprehensive policy with safeguards)
  * Degree of Discretion/Flexibility (centralized rules vs departmental adaptability)
  Avoid trivial wording variations of the same idea.
- GROUNDING: Every approach MUST be strictly grounded in the supplied analysis:
  * In the 'addresses' list, connect each action directly to an actual concern present in that stakeholder's perspective.
  * In the 'tradeoffs' list, explicitly surface the potential downsides, frictions, or costs that this approach could create.
- CAUTIOUS TRUST LANGUAGE: Use strictly cautious, probabilistic phrasing for trade-offs and consequences:
  * "may require"
  * "could increase"
  * "could reduce"
  * "may create"
  * "may introduce"
  * "could make implementation more complex"
  * "may require additional coordination"
  Never assert speculative outcomes as established facts ("will definitely", "everyone will agree").
- STAKEHOLDER ID INTEGRITY: Every stakeholder ID in 'addresses[].stakeholderId' and 'tradeoffs[].affectedStakeholders[]' MUST strictly match an ID from the confirmed stakeholder list. Never invent or hallucinate external stakeholders.
- Never stereotype groups or assume homogeneous thinking.
`;

/**
 * Builds the structured user prompt containing problem context, confirmed stakeholders, generated perspectives, and comparison analysis.
 *
 * @param {object} problemModel - The validated ProblemModel.
 * @param {Array<object>} confirmedStakeholders - List of confirmed stakeholders.
 * @param {Array<object>} perspectives - List of generated perspectives.
 * @param {object} comparison - The validated Comparison output.
 * @returns {string} The formatted user prompt.
 */
export function buildExplorationEnginePrompt(problemModel, confirmedStakeholders, perspectives, comparison) {
  const stakeholderIdList = confirmedStakeholders.map((s) => s.id);

  let prompt = `Generate 3 to 5 meaningfully different alternative approaches for exploring the decision below, grounded strictly in the perspectives, tensions, and dependencies provided.

=== DECISION CONTEXT ===
Decision: ${problemModel.decision}
Domain: ${problemModel.domain}
Summary: ${problemModel.summary}

Facts:
${problemModel.facts.map((f) => `- ${f}`).join("\n")}

Assumptions:
${problemModel.assumptions.map((a) => `- ${a}`).join("\n")}

=== CONFIRMED STAKEHOLDERS ===
Allowed Stakeholder IDs: [ ${stakeholderIdList.join(", ")} ]

${confirmedStakeholders
  .map(
    (s) => `- ID: "${s.id}" | Name: "${s.name}" | Relevance: ${s.relevance}
  Reason: ${s.reason}`
  )
  .join("\n\n")}

=== PERSPECTIVE CONCERNS & PRIORITIES ===
${perspectives
  .map((p) => {
    const sName = confirmedStakeholders.find((s) => s.id === p.stakeholderId)?.name || p.stakeholderId;
    return `--- Stakeholder: "${sName}" (ID: "${p.stakeholderId}") ---
Concerns:
${p.concerns.map((c) => `  - [${c.basis.toUpperCase()}] ${c.text}`).join("\n")}
Constraints:
${p.constraints.map((c) => `  - [${c.basis.toUpperCase()}] ${c.text}`).join("\n")}
Priorities:
${p.priorities.map((pr) => `  - [${pr.basis.toUpperCase()}] ${pr.text}`).join("\n")}`;
  })
  .join("\n\n")}

=== IDENTIFIED TENSIONS & DEPENDENCIES ===
Tensions:
${
  comparison.tensions && comparison.tensions.length > 0
    ? comparison.tensions.map((t) => `- ${t.title}: ${t.explanation}`).join("\n")
    : "None explicitly surfaced."
}

Dependencies:
${
  comparison.dependencies && comparison.dependencies.length > 0
    ? comparison.dependencies.map((d) => `- ${d.description} (Involved: ${d.stakeholders.join(", ")})`).join("\n")
    : "None explicitly surfaced."
}

Different Priorities:
${
  comparison.differentPriorities && comparison.differentPriorities.length > 0
    ? comparison.differentPriorities.map((dp) => `- ${dp.topic}: ${dp.perspectiveA} vs ${dp.perspectiveB}`).join("\n")
    : "None explicitly surfaced."
}

=== INSTRUCTIONS ===
1. Generate 3 to 5 alternative approaches exploring distinct ways to navigate these tensions and concerns.
2. For each approach, detail:
   - Unique id (e.g. 'phased-implementation')
   - title
   - description
   - addresses: list of { stakeholderId, concern } referencing actual concerns from the perspective data above.
   - tradeoffs: list of { description, affectedStakeholders } highlighting real compromises, frictions, or costs using cautious phrasing ("may require", "could complicate").
   - implementationConsiderations: list of practical operational factors.
3. Every referenced stakeholderId MUST strictly exist in Allowed Stakeholder IDs: [ ${stakeholderIdList.join(", ")} ].
4. DO NOT rank, score, or declare any approach "best" or "recommended".
`;

  return prompt;
}
