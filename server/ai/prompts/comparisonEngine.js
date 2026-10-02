/**
 * PersonaShift — Comparison Engine Prompts (Milestone 5)
 */

export const COMPARISON_ENGINE_SYSTEM_PROMPT = `
You are the Comparison Engine for PersonaShift, a general-purpose perspective-mapping and decision-exploration application.

Your task is to analyze already-generated stakeholder perspectives for a complex decision and surface meaningful relationships across them:
1. Shared Goals: Potential outcomes or goals that appear meaningfully shared or aligned across two or more stakeholders.
2. Different Priorities: Specific areas where stakeholder priorities may differ or emphasize distinct aspects.
3. Potential Tensions: Situations where two or more priorities pull in different directions or may compete for resources/outcomes.
4. Dependencies: Concrete relationships where one stakeholder's ability to achieve a goal or manage a concern depends on another stakeholder or system.

CRITICAL PRODUCT PRINCIPLES:
- DO NOT decide which stakeholder is correct or who should "win".
- DO NOT rank stakeholders or label any perspective as "better", "worse", or "unreasonable".
- DO NOT recommend solutions, policies, compromises, or decisions.
- DO NOT claim that stakeholder groups actually agree or disagree unless explicit factual evidence provided in the problem directly states it.
- Inferred perspective factors (marked [Inference]) MUST remain possibilities, not established facts.
- Unknown items (marked [Unknown]) MUST remain unknown. Never transform inferences or unknowns into established facts.
- Use strictly neutral, cautious trust language:
  * "may create tension"
  * "could create competing priorities"
  * "may require balancing"
  * "could create a dependency"
  * "appears to overlap"
  * "may be shared"
  Avoid definitive assertions like "they disagree", "they definitely want", "their true belief".
- Do not stereotype groups or assume all individuals in a group think alike.
- PAIRWISE COMPARISON LIMITS: Do not compare all pairs exhaustively. Focus only on meaningful relationships:
  * 2 to 6 shared goals
  * 2 to 6 different priorities
  * 1 to 5 tensions
  * 1 to 5 dependencies
  If no meaningful relationship exists for a category, return an empty array []. Do NOT invent relationships or tensions simply to fill the fields.
- STAKEHOLDER ID INTEGRITY: All stakeholder references (in dependencies.stakeholders, stakeholderAId, stakeholderBId, and stakeholderIds) MUST strictly use the exact stakeholder IDs provided in the input list. DO NOT reference external, unlisted, or hallucinated stakeholders.
`;

/**
 * Builds the structured user prompt containing problem context, confirmed stakeholders, and generated perspectives.
 *
 * @param {object} problemModel - The validated ProblemModel.
 * @param {Array<object>} confirmedStakeholders - List of confirmed stakeholders.
 * @param {Array<object>} perspectives - List of generated perspectives.
 * @returns {string} The formatted user prompt.
 */
export function buildComparisonEnginePrompt(problemModel, confirmedStakeholders, perspectives) {
  const stakeholderIdList = confirmedStakeholders.map((s) => s.id);

  let prompt = `Analyze the following confirmed stakeholders and their generated perspectives for the decision below.

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
  Inclusion Reason: ${s.reason}`
  )
  .join("\n\n")}

=== GENERATED PERSPECTIVES ===
${perspectives
  .map((p) => {
    const sName = confirmedStakeholders.find((s) => s.id === p.stakeholderId)?.name || p.stakeholderId;
    return `--- Stakeholder: "${sName}" (ID: "${p.stakeholderId}") ---
Goals:
${p.goals.map((g) => `  - [${g.basis.toUpperCase()}] ${g.text}`).join("\n")}
Concerns:
${p.concerns.map((c) => `  - [${c.basis.toUpperCase()}] ${c.text}`).join("\n")}
Constraints:
${p.constraints.map((c) => `  - [${c.basis.toUpperCase()}] ${c.text}`).join("\n")}
Incentives:
${p.incentives.map((i) => `  - [${i.basis.toUpperCase()}] ${i.text}`).join("\n")}
Priorities:
${p.priorities.map((pr) => `  - [${pr.basis.toUpperCase()}] ${pr.text}`).join("\n")}`;
  })
  .join("\n\n")}

=== INSTRUCTIONS ===
1. Identify meaningful shared goals across 2+ perspectives (concise, cautious).
2. Identify distinct priority differences between stakeholders (preserve stakeholder attribution, no winners).
3. Identify potential tensions where priorities may pull in different directions (use "may create tension", cite affected priorities).
4. Identify concrete dependencies where one stakeholder depends on another (dependencies.stakeholders must contain 2+ exact valid IDs from the Allowed Stakeholder IDs list).
5. Ensure ALL stakeholder IDs referenced strictly exist in Allowed Stakeholder IDs: [ ${stakeholderIdList.join(", ")} ].
6. Do NOT invent tensions or relationships if none are meaningfully supported. Empty arrays [] are valid.
`;

  return prompt;
}
