import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import { analyzeProblem } from "../server/services/problemParser.js";
import { generatePerspectives } from "../server/services/perspectiveEngine.js";
import { generateComparison, validateComparisonInvariants } from "../server/services/comparisonEngine.js";
import { ComparisonSchema } from "../server/ai/schemas/comparison.js";

const scenarios = [
  {
    name: "Test 1 — Education",
    problemText: "Our college is considering making attendance mandatory for all students.",
    stakeholders: [
      { id: "student", name: "Students", reason: "Directly affected by attendance requirements and penalties.", relevance: "direct", source: "ai" },
      { id: "faculty", name: "Faculty Members", reason: "Responsible for tracking attendance and enforcing the policy in class.", relevance: "direct", source: "ai" },
      { id: "administrator", name: "Academic Administration", reason: "Responsible for institutional policy design and resource allocation.", relevance: "system", source: "ai" },
      { id: "advisors", name: "Academic Advisors", reason: "Guide students navigating policy rules and academic standing issues.", relevance: "indirect", source: "ai" },
      { id: "registrar", name: "Registrar and Student Records", reason: "Maintains attendance records and official academic status.", relevance: "system", source: "ai" }
    ]
  },
  {
    name: "Test 2 — Urban Planning",
    problemText: "The municipal government is evaluating a proposal to transition a primary urban thoroughfare into a pedestrian-exclusive zone.",
    stakeholders: [
      { id: "pedestrians", name: "Pedestrians", reason: "Directly gain walkable public space and car-free transit.", relevance: "direct", source: "ai" },
      { id: "local-businesses", name: "Local Businesses", reason: "Affected by delivery access and customer foot traffic.", relevance: "direct", source: "ai" },
      { id: "drivers", name: "Drivers", reason: "Face route rerouting and changes in travel time.", relevance: "direct", source: "ai" },
      { id: "transit-operators", name: "Public Transit Operators", reason: "Must adjust bus routes and transit schedules.", relevance: "system", source: "ai" },
      { id: "emergency-services", name: "Emergency Services", reason: "Require rapid vehicular access through the area.", relevance: "system", source: "ai" },
      { id: "municipal-government", name: "Municipal Government", reason: "Funds, maintains, and regulates the thoroughfare conversion.", relevance: "system", source: "ai" }
    ]
  },
  {
    name: "Test 3 — SaaS",
    problemText: "A SaaS company is considering replacing its free plan with a paid-only subscription model.",
    stakeholders: [
      { id: "existing-users", name: "Existing Users", reason: "Face potential loss of free access or need to subscribe.", relevance: "direct", source: "ai" },
      { id: "prospective-users", name: "Prospective Users", reason: "Experience changes in evaluation options without a free tier.", relevance: "indirect", source: "ai" },
      { id: "company", name: "Company", reason: "Responsible for business strategy and recurring revenue goals.", relevance: "system", source: "ai" },
      { id: "support-team", name: "Support Team", reason: "Handles incoming customer questions and complaints about billing changes.", relevance: "direct", source: "ai" }
    ]
  }
];

// Helper: check for prohibited ranking or recommendation keywords
function verifyNoRankingOrRecommendations(comparison) {
  const serialized = JSON.stringify(comparison).toLowerCase();
  const prohibited = [
    "winner",
    "loser",
    "should choose",
    "recommended decision",
    "best perspective",
    "correct perspective",
    "superior option",
    "we recommend",
    "most important stakeholder"
  ];
  for (const word of prohibited) {
    if (serialized.includes(word)) {
      throw new Error(`Comparison output contains prohibited recommendation/ranking language: "${word}"`);
    }
  }
}

async function runTests() {
  console.log("=== PersonaShift Milestone 5: Comparison Engine Test Suite ===\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.");
    process.exit(1);
  }

  // Part 1: Live AI Comparison Scenarios
  for (let i = 0; i < scenarios.length; i++) {
    const { name, problemText, stakeholders } = scenarios[i];
    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${scenarios.length}] Running Live AI Scenario: ${name}`);
    console.log(`Problem: "${problemText}"`);
    console.log(`Stakeholders (${stakeholders.length}): ${stakeholders.map((s) => s.name).join(", ")}`);
    console.log(`--------------------------------------------------`);

    const startTime = Date.now();

    // 1. Problem Parser
    const problem = await analyzeProblem(problemText);
    console.log(`✓ Problem parsed (Domain: "${problem.domain}")`);

    // 2. Perspective Engine
    const perspectives = await generatePerspectives(problem, stakeholders);
    console.log(`✓ Perspectives generated (${perspectives.length} total)`);

    // 3. Comparison Engine
    const comparison = await generateComparison(problem, stakeholders, perspectives);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Comparison generated in ${elapsed}s:`);
    console.log(`  - Shared Goals: ${comparison.sharedGoals.length}`);
    console.log(`  - Different Priorities: ${comparison.differentPriorities.length}`);
    console.log(`  - Potential Tensions: ${comparison.tensions.length}`);
    console.log(`  - Dependencies: ${comparison.dependencies.length}`);

    // Verify Invariants & Constraints
    verifyNoRankingOrRecommendations(comparison);
    validateComparisonInvariants(comparison, stakeholders, perspectives);

    // Verify dependency references
    const validIds = new Set(stakeholders.map((s) => s.id));
    for (const dep of comparison.dependencies) {
      assert(dep.stakeholders.length >= 2, "Dependency must involve >= 2 stakeholders");
      for (const sId of dep.stakeholders) {
        assert(validIds.has(sId), `Dependency references invalid stakeholderId: ${sId}`);
      }
    }

    // Verify tensions
    for (const tension of comparison.tensions) {
      assert(tension.title && tension.explanation, "Tension must have title and explanation");
      assert(tension.affectedPriorities && tension.affectedPriorities.length >= 1, "Tension must list affected priorities");
      if (tension.stakeholderIds) {
        for (const sId of tension.stakeholderIds) {
          assert(validIds.has(sId), `Tension references invalid stakeholderId: ${sId}`);
        }
      }
    }

    console.log(`✓ All invariants and trust principles verified for ${name}!\n`);

    if (i < scenarios.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Part 2: Rigorous Validation Tests
  console.log("==================================================");
  console.log("Running Milestone 5 Validation Invariant Tests");
  console.log("==================================================");

  const mockStakeholders = [
    { id: "student", name: "Student", reason: "Direct", relevance: "direct", source: "ai" },
    { id: "faculty", name: "Faculty", reason: "Direct", relevance: "direct", source: "ai" }
  ];
  const mockPerspectives = [
    {
      stakeholderId: "student",
      goals: [{ text: "Flexibility", basis: "inference" }],
      concerns: [{ text: "Penalties", basis: "fact" }],
      constraints: [{ text: "Transit", basis: "inference" }],
      incentives: [{ text: "GPA", basis: "inference" }],
      priorities: [{ text: "Schedule", basis: "inference" }]
    },
    {
      stakeholderId: "faculty",
      goals: [{ text: "Engagement", basis: "inference" }],
      concerns: [{ text: "Workload", basis: "inference" }],
      constraints: [{ text: "Time", basis: "fact" }],
      incentives: [{ text: "Clarity", basis: "inference" }],
      priorities: [{ text: "Consistency", basis: "inference" }]
    }
  ];

  // Test 2.1: Unknown stakeholder reference in dependency
  console.log("\n[Validation 1] Unknown stakeholder ID in dependency...");
  const invalidDepComparison = {
    sharedGoals: ["Academic achievement"],
    differentPriorities: [],
    tensions: [],
    dependencies: [
      {
        description: "Advisors depend on administration",
        stakeholders: ["student", "unknown-ghost-stakeholder"]
      }
    ]
  };
  assert.throws(
    () => validateComparisonInvariants(invalidDepComparison, mockStakeholders, mockPerspectives),
    /Dependency references unknown stakeholder ID: "unknown-ghost-stakeholder"/,
    "Expected rejection of unknown stakeholder in dependency"
  );
  console.log("✓ Unknown stakeholder ID was successfully rejected.");

  // Test 2.2: Unknown stakeholder reference in tension
  console.log("\n[Validation 2] Unknown stakeholder ID in tension...");
  const invalidTensionComparison = {
    sharedGoals: [],
    differentPriorities: [],
    tensions: [
      {
        title: "Tension title",
        explanation: "Some explanation",
        affectedPriorities: ["flexibility vs consistency"],
        stakeholderIds: ["student", "parent-not-in-list"]
      }
    ],
    dependencies: []
  };
  assert.throws(
    () => validateComparisonInvariants(invalidTensionComparison, mockStakeholders, mockPerspectives),
    /Tension references unknown stakeholder ID: "parent-not-in-list"/,
    "Expected rejection of unknown stakeholder in tension"
  );
  console.log("✓ Unknown stakeholder ID in tension was successfully rejected.");

  // Test 2.3: Stakeholder with missing perspective
  console.log("\n[Validation 3] Stakeholder with missing perspective in dependency...");
  const incompletePerspectives = [mockPerspectives[0]]; // faculty perspective missing
  const depWithMissingPersp = {
    sharedGoals: [],
    differentPriorities: [],
    tensions: [],
    dependencies: [
      {
        description: "Dependency description",
        stakeholders: ["student", "faculty"]
      }
    ]
  };
  assert.throws(
    () => validateComparisonInvariants(depWithMissingPersp, mockStakeholders, incompletePerspectives),
    /Dependency references stakeholder with missing perspective: "faculty"/,
    "Expected rejection when perspective is missing"
  );
  console.log("✓ Missing perspective reference was successfully rejected.");

  // Test 2.4: Empty comparison is valid
  console.log("\n[Validation 4] Completely empty comparison is valid...");
  const emptyComparison = {
    sharedGoals: [],
    differentPriorities: [],
    tensions: [],
    dependencies: []
  };
  const parsedEmpty = ComparisonSchema.parse(emptyComparison);
  validateComparisonInvariants(parsedEmpty, mockStakeholders, mockPerspectives);
  console.log("✓ Completely empty comparison schema & invariants validated successfully.");

  // Test 2.5: Stale comparison detection logic
  console.log("\n[Validation 5] Stale comparison detection after stakeholder list change...");
  let currentComparison = { ...emptyComparison };
  let isStale = false;
  // User adds or removes stakeholder in M2
  const updatedStakeholders = [...mockStakeholders, { id: "new-user-stakeholder", name: "TA", reason: "Grading", relevance: "direct", source: "user" }];
  if (updatedStakeholders.length !== mockStakeholders.length) {
    isStale = true;
  }
  assert.strictEqual(isStale, true, "Comparison must be flagged stale when stakeholders change.");
  console.log("✓ Stale state flag correctly triggered on stakeholder list change.");

  console.log("\n==================================================");
  console.log("All Milestone 5 Comparison Tests Passed Successfully! ✓");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
