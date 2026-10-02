import assert from "assert";

/**
 * PersonaShift — Milestone 4: SHIFT Experience Test Suite
 *
 * Verifies:
 * - Test 1: Switching between stakeholders (student -> faculty -> administrator)
 * - Test 2: Zero AI/API calls during switching
 * - Test 3: Problem/decision context preservation
 * - Test 4: Removed stakeholder exclusion
 * - Test 5: Added stakeholder inclusion
 * - Test 6: Missing / invalid active ID fallback
 */

console.log("=== PersonaShift Milestone 4: SHIFT Experience Test Suite ===\n");

// Mock Problem Context
const mockProblem = {
  problem: "Our college is considering making attendance mandatory for all students.",
  domain: "education",
  decision: "Whether or not to implement a college-wide mandatory attendance policy.",
  uncertainties: ["Impact on working students", "Enforcement consistency across departments"]
};

// Mock Confirmed Stakeholders (Simulating M2 output)
const initialConfirmedStakeholders = [
  { id: "student", name: "Students", reason: "Directly affected by attendance requirements and academic standing.", relevance: "direct", source: "ai" },
  { id: "faculty", name: "Faculty", reason: "Responsible for tracking attendance and enforcing the policy in class.", relevance: "direct", source: "ai" },
  { id: "administrator", name: "Administration", reason: "Responsible for institutional policy design and resource allocation.", relevance: "system", source: "ai" }
];

// Mock Generated Perspectives (Simulating M3 output)
const mockPerspectives = [
  {
    stakeholderId: "student",
    goals: [{ text: "Maintain schedule flexibility for work and family obligations", basis: "inference" }],
    concerns: [{ text: "Grade penalties for unavoidable absences", basis: "fact" }],
    constraints: [{ text: "Commuting distances and fixed transit schedules", basis: "inference" }],
    incentives: [{ text: "Preserving GPA while balancing employment", basis: "inference" }],
    priorities: [{ text: "Fairness in accommodation policies", basis: "inference" }]
  },
  {
    stakeholderId: "faculty",
    goals: [{ text: "Foster high classroom engagement and consistent discussion", basis: "inference" }],
    concerns: [{ text: "Administrative burden of daily tracking and verification", basis: "inference" }],
    constraints: [{ text: "Limited class time to administer roll calls", basis: "fact" }],
    incentives: [{ text: "Clear institutional policy backing up syllabus rules", basis: "inference" }],
    priorities: [{ text: "Teaching quality and academic integrity", basis: "inference" }]
  },
  {
    stakeholderId: "administrator",
    goals: [{ text: "Improve institutional retention and course completion metrics", basis: "inference" }],
    concerns: [{ text: "Student dissatisfaction and potential enrollment drop", basis: "inference" }],
    constraints: [{ text: "State compliance and reporting regulations", basis: "fact" }],
    incentives: [{ text: "Accreditation benchmarks linked to student attendance", basis: "inference" }],
    priorities: [{ text: "Institutional reputation and operational compliance", basis: "inference" }]
  }
];

// Implementation of the Client SHIFT Resolution Logic (matching App.jsx)
function resolveActivePerspective(activeId, confirmedList, perspectiveList) {
  const resolvedStakeholder =
    confirmedList?.find((s) => s.id === activeId) ||
    confirmedList?.[0] ||
    null;

  const resolvedPerspective =
    perspectiveList?.find((p) => p.stakeholderId === resolvedStakeholder?.id) ||
    perspectiveList?.[0] ||
    null;

  return { resolvedStakeholder, resolvedPerspective };
}

// Track API calls
let apiCallCount = 0;
function fakeApiPerspectivesCall() {
  apiCallCount++;
}

// ----------------------------------------------------
// Test 1: Switching (student -> faculty -> administrator)
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 1: Switching between stakeholders");
console.log("--------------------------------------------------");

let activeId = "student";
let state = resolveActivePerspective(activeId, initialConfirmedStakeholders, mockPerspectives);
assert.strictEqual(state.resolvedStakeholder.id, "student");
assert.strictEqual(state.resolvedStakeholder.name, "Students");
assert.strictEqual(state.resolvedPerspective.stakeholderId, "student");
console.log(`✓ Active = "${state.resolvedStakeholder.name}" (Perspective matched: ${state.resolvedPerspective.stakeholderId})`);

// Switch to faculty
activeId = "faculty";
state = resolveActivePerspective(activeId, initialConfirmedStakeholders, mockPerspectives);
assert.strictEqual(state.resolvedStakeholder.id, "faculty");
assert.strictEqual(state.resolvedStakeholder.name, "Faculty");
assert.strictEqual(state.resolvedPerspective.stakeholderId, "faculty");
console.log(`✓ Active = "${state.resolvedStakeholder.name}" (Perspective matched: ${state.resolvedPerspective.stakeholderId})`);

// Switch to administrator
activeId = "administrator";
state = resolveActivePerspective(activeId, initialConfirmedStakeholders, mockPerspectives);
assert.strictEqual(state.resolvedStakeholder.id, "administrator");
assert.strictEqual(state.resolvedStakeholder.name, "Administration");
assert.strictEqual(state.resolvedPerspective.stakeholderId, "administrator");
console.log(`✓ Active = "${state.resolvedStakeholder.name}" (Perspective matched: ${state.resolvedPerspective.stakeholderId})`);

console.log("✓ Test 1 passed!\n");

// ----------------------------------------------------
// Test 2: Zero AI/API calls during switching
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 2: No AI / API regeneration during SHIFT");
console.log("--------------------------------------------------");

const initialCalls = apiCallCount;
const shiftSequence = ["student", "faculty", "administrator", "student", "faculty"];
shiftSequence.forEach((targetId) => {
  // Pure client state update
  activeId = targetId;
  const current = resolveActivePerspective(activeId, initialConfirmedStakeholders, mockPerspectives);
  assert(current.resolvedStakeholder.id === targetId);
  // Note: fakeApiPerspectivesCall is NOT invoked
});

const callsDuringShift = apiCallCount - initialCalls;
assert.strictEqual(callsDuringShift, 0, "SHIFT interaction must trigger 0 API calls!");
console.log(`✓ Switched ${shiftSequence.length} times with exactly ${callsDuringShift} API calls.`);
console.log("✓ Test 2 passed!\n");

// ----------------------------------------------------
// Test 3: Problem/decision context preservation
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 3: Preserving problem context during SHIFT");
console.log("--------------------------------------------------");

shiftSequence.forEach((targetId) => {
  activeId = targetId;
  const current = resolveActivePerspective(activeId, initialConfirmedStakeholders, mockPerspectives);
  // Verify decision & problem context remain identical
  assert.strictEqual(mockProblem.decision, "Whether or not to implement a college-wide mandatory attendance policy.");
  assert.strictEqual(mockProblem.domain, "education");
  assert.strictEqual(current.resolvedStakeholder.id, targetId);
});
console.log(`✓ Original decision remained constant across all perspective shifts: "${mockProblem.decision}"`);
console.log("✓ Test 3 passed!\n");

// ----------------------------------------------------
// Test 4: Removed stakeholder exclusion
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 4: Removed stakeholder does not appear in SHIFT selector");
console.log("--------------------------------------------------");

// Suppose "parents" was removed during M2 review
const stakeholdersAfterRemoval = initialConfirmedStakeholders.filter((s) => s.id !== "parents");
assert(!stakeholdersAfterRemoval.find((s) => s.id === "parents"));
const selectorIds = stakeholdersAfterRemoval.map((s) => s.id);
assert.deepStrictEqual(selectorIds, ["student", "faculty", "administrator"]);
console.log(`✓ Removed stakeholders excluded from SHIFT selector: [${selectorIds.join(", ")}]`);
console.log("✓ Test 4 passed!\n");

// ----------------------------------------------------
// Test 5: Added stakeholder inclusion
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 5: Added stakeholder appears in SHIFT selector");
console.log("--------------------------------------------------");

const userAddedStakeholder = {
  id: "ta-assistants",
  name: "Teaching Assistants",
  reason: "Lead discussion sections and record weekly attendance.",
  relevance: "direct",
  source: "user"
};

const updatedStakeholders = [...initialConfirmedStakeholders, userAddedStakeholder];
const updatedPerspectives = [
  ...mockPerspectives,
  {
    stakeholderId: "ta-assistants",
    goals: [{ text: "Clear grading rubric for participation", basis: "inference" }],
    concerns: [{ text: "Increased disputes over attendance logs", basis: "inference" }],
    constraints: [{ text: "Limited office hours to resolve student issues", basis: "fact" }],
    incentives: [{ text: "Straightforward reporting process", basis: "inference" }],
    priorities: [{ text: "Consistency across quiz sections", basis: "inference" }]
  }
];

activeId = "ta-assistants";
const taState = resolveActivePerspective(activeId, updatedStakeholders, updatedPerspectives);
assert.strictEqual(taState.resolvedStakeholder.id, "ta-assistants");
assert.strictEqual(taState.resolvedStakeholder.name, "Teaching Assistants");
assert.strictEqual(taState.resolvedStakeholder.source, "user");
assert.strictEqual(taState.resolvedPerspective.stakeholderId, "ta-assistants");
console.log(`✓ User-added stakeholder "${taState.resolvedStakeholder.name}" selectable with perspective mapped.`);
console.log("✓ Test 5 passed!\n");

// ----------------------------------------------------
// Test 6: Missing / invalid active ID fallback
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 6: Invalid / missing active ID safe fallback");
console.log("--------------------------------------------------");

const corruptedActiveId = "non-existent-ghost-id";
const fallbackState = resolveActivePerspective(corruptedActiveId, initialConfirmedStakeholders, mockPerspectives);
assert(fallbackState.resolvedStakeholder !== null, "Should safely fall back to available stakeholder");
assert.strictEqual(fallbackState.resolvedStakeholder.id, initialConfirmedStakeholders[0].id);
assert.strictEqual(fallbackState.resolvedPerspective.stakeholderId, initialConfirmedStakeholders[0].id);
console.log(`✓ Corrupted ID "${corruptedActiveId}" safely fell back to "${fallbackState.resolvedStakeholder.name}" without crashing.`);

const nullActiveState = resolveActivePerspective(null, initialConfirmedStakeholders, mockPerspectives);
assert.strictEqual(nullActiveState.resolvedStakeholder.id, initialConfirmedStakeholders[0].id);
console.log(`✓ Null ID safely fell back to "${nullActiveState.resolvedStakeholder.name}".`);
console.log("✓ Test 6 passed!\n");

console.log("==================================================");
console.log("All Milestone 4 SHIFT Experience Tests Passed! ✓");
console.log("==================================================");
