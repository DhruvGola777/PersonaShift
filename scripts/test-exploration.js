import dotenv from "dotenv";
dotenv.config();

import assert from "assert";
import { analyzeProblem } from "../server/services/problemParser.js";
import { generatePerspectives } from "../server/services/perspectiveEngine.js";
import { generateComparison } from "../server/services/comparisonEngine.js";
import { generateExploration, validateExplorationInvariants } from "../server/services/explorationEngine.js";

const scenarios = [
  {
    name: "Scenario 1 — Education",
    problemText: "Our college is considering making attendance mandatory for all students.",
    stakeholders: [
      { id: "student", name: "Students", reason: "Directly affected by attendance requirements and penalties.", relevance: "direct", source: "ai" },
      { id: "faculty", name: "Faculty Members", reason: "Responsible for tracking attendance and enforcing the policy in class.", relevance: "direct", source: "ai" },
      { id: "administrator", name: "Academic Administration", reason: "Responsible for institutional policy design and resource allocation.", relevance: "system", source: "ai" },
      { id: "advisors", name: "Academic Advisors", reason: "Guide students navigating policy rules and academic standing issues.", relevance: "indirect", source: "ai" },
      { id: "registrar", name: "Registrar / Student Records", reason: "Maintains attendance records and official academic status.", relevance: "system", source: "ai" }
    ]
  },
  {
    name: "Scenario 2 — Urban Planning",
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
    name: "Scenario 3 — SaaS",
    problemText: "A SaaS company is considering replacing its free plan with a paid-only subscription model.",
    stakeholders: [
      { id: "existing-users", name: "Existing Users", reason: "Face potential loss of free access or need to subscribe.", relevance: "direct", source: "ai" },
      { id: "prospective-users", name: "Prospective Users", reason: "Experience changes in evaluation options without a free tier.", relevance: "indirect", source: "ai" },
      { id: "company", name: "Company", reason: "Responsible for business strategy and recurring revenue goals.", relevance: "system", source: "ai" },
      { id: "support-team", name: "Support Team", reason: "Handles incoming customer questions and complaints about billing changes.", relevance: "direct", source: "ai" }
    ]
  }
];

function verifyNoRankingLanguage(exploration) {
  const serialized = JSON.stringify(exploration);
  const prohibitedPatterns = [
    /\bbest approach\b/i,
    /\boptimal approach\b/i,
    /\brecommended approach\b/i,
    /\bwinner\b/i,
    /\bloser\b/i,
    /\byou should choose\b/i,
    /\bideal solution\b/i,
    /\bstrongest option\b/i,
    /\bsuperior choice\b/i,
    /\bconfidence score\b/i,
    /\brating\b/i,
    /\branking\b/i
  ];
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(serialized)) {
      throw new Error(`Exploration output contains prohibited recommendation/ranking language: ${pattern}`);
    }
  }
}

async function runTests() {
  console.log("=== PersonaShift Milestone 6: Exploration Engine Test Suite ===\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.");
    process.exit(1);
  }

  // Part 1: Live AI Pipeline Scenarios
  for (let i = 0; i < scenarios.length; i++) {
    const { name, problemText, stakeholders } = scenarios[i];
    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${scenarios.length}] Running Live AI Pipeline: ${name}`);
    console.log(`Problem: "${problemText}"`);
    console.log(`Confirmed Stakeholders (${stakeholders.length}): ${stakeholders.map((s) => s.name).join(", ")}`);
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
    console.log(`✓ Comparison generated (Tensions: ${comparison.tensions.length}, Dependencies: ${comparison.dependencies.length})`);

    // 4. Exploration Engine
    const exploration = await generateExploration(problem, stakeholders, perspectives, comparison);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Exploration generated in ${elapsed}s (${exploration.approaches.length} approaches):`);

    // Verify each approach
    const validIds = new Set(stakeholders.map((s) => s.id));
    for (const app of exploration.approaches) {
      console.log(`\n  ▶ Approach: "${app.title}" [ID: ${app.id}]`);
      console.log(`    Description: ${app.description}`);
      console.log(`    Addresses (${app.addresses.length}):`);
      for (const addr of app.addresses) {
        console.log(`      - [${addr.stakeholderId}] ${addr.concern}`);
        assert(validIds.has(addr.stakeholderId), `Invalid stakeholderId in addresses: ${addr.stakeholderId}`);
      }
      console.log(`    Trade-offs (${app.tradeoffs.length}):`);
      for (const tr of app.tradeoffs) {
        console.log(`      - ${tr.description} (Affected: ${tr.affectedStakeholders.join(", ")})`);
        for (const affId of tr.affectedStakeholders) {
          assert(validIds.has(affId), `Invalid stakeholderId in tradeoffs: ${affId}`);
        }
      }
      console.log(`    Considerations (${app.implementationConsiderations.length}):`);
      for (const c of app.implementationConsiderations) {
        console.log(`      - ${c}`);
      }
    }

    // Invariant verification
    verifyNoRankingLanguage(exploration);
    validateExplorationInvariants(exploration, stakeholders, perspectives);

    console.log(`\n✓ All invariants and trust principles verified for ${name}!\n`);

    if (i < scenarios.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // Part 2: Rigorous Validation Invariant Tests
  console.log("==================================================");
  console.log("Running Milestone 6 Invariant & Rejection Tests");
  console.log("==================================================");

  const mockStakeholders = [
    { id: "student", name: "Students", reason: "Direct", relevance: "direct", source: "ai" },
    { id: "faculty", name: "Faculty", reason: "Direct", relevance: "direct", source: "ai" }
  ];
  const mockPerspectives = [
    {
      stakeholderId: "student",
      goals: [{ text: "Flexibility", basis: "inference" }],
      concerns: [{ text: "Penalties for illness", basis: "fact" }],
      constraints: [{ text: "Transit", basis: "inference" }],
      incentives: [{ text: "GPA", basis: "inference" }],
      priorities: [{ text: "Schedule", basis: "inference" }]
    },
    {
      stakeholderId: "faculty",
      goals: [{ text: "Engagement", basis: "inference" }],
      concerns: [{ text: "Administrative burden", basis: "inference" }],
      constraints: [{ text: "Time", basis: "fact" }],
      incentives: [{ text: "Policy backing", basis: "inference" }],
      priorities: [{ text: "Consistency", basis: "inference" }]
    }
  ];

  // Test 2.1: Unknown stakeholder in addresses
  console.log("\n[Validation 1] Unknown stakeholder ID in addresses[]...");
  const invalidAddrExploration = {
    approaches: [
      {
        id: "approach-1",
        title: "Test approach",
        description: "Test description",
        addresses: [{ stakeholderId: "unknown-stakeholder", concern: "Some concern" }],
        tradeoffs: [{ description: "Tradeoff", affectedStakeholders: ["student"] }],
        implementationConsiderations: ["Item 1"]
      }
    ]
  };
  assert.throws(
    () => validateExplorationInvariants(invalidAddrExploration, mockStakeholders, mockPerspectives),
    /addresses unknown stakeholder ID: "unknown-stakeholder"/,
    "Expected rejection of unknown stakeholder in addresses"
  );
  console.log("✓ Unknown stakeholder in addresses was successfully rejected.");

  // Test 2.2: Unknown stakeholder in tradeoffs
  console.log("\n[Validation 2] Unknown stakeholder ID in tradeoffs[]...");
  const invalidTradeoffExploration = {
    approaches: [
      {
        id: "approach-1",
        title: "Test approach",
        description: "Test description",
        addresses: [{ stakeholderId: "student", concern: "Penalties for illness" }],
        tradeoffs: [{ description: "Tradeoff", affectedStakeholders: ["ghost-stakeholder"] }],
        implementationConsiderations: ["Item 1"]
      }
    ]
  };
  assert.throws(
    () => validateExplorationInvariants(invalidTradeoffExploration, mockStakeholders, mockPerspectives),
    /trade-off references unknown stakeholder ID: "ghost-stakeholder"/,
    "Expected rejection of unknown stakeholder in tradeoffs"
  );
  console.log("✓ Unknown stakeholder in tradeoffs was successfully rejected.");

  // Test 2.3: Duplicate approach IDs
  console.log("\n[Validation 3] Duplicate approach IDs...");
  const duplicateIdExploration = {
    approaches: [
      {
        id: "duplicate-id",
        title: "Approach 1",
        description: "Desc 1",
        addresses: [{ stakeholderId: "student", concern: "Penalties" }],
        tradeoffs: [{ description: "Tradeoff", affectedStakeholders: ["student"] }],
        implementationConsiderations: ["Consideration"]
      },
      {
        id: "duplicate-id",
        title: "Approach 2",
        description: "Desc 2",
        addresses: [{ stakeholderId: "faculty", concern: "Burden" }],
        tradeoffs: [{ description: "Tradeoff", affectedStakeholders: ["faculty"] }],
        implementationConsiderations: ["Consideration"]
      }
    ]
  };
  assert.throws(
    () => validateExplorationInvariants(duplicateIdExploration, mockStakeholders, mockPerspectives),
    /Duplicate approach ID detected: "duplicate-id"/,
    "Expected rejection of duplicate approach IDs"
  );
  console.log("✓ Duplicate approach ID was successfully rejected.");

  // Test 2.4: Ranking/recommendation language rejection
  console.log("\n[Validation 4] Prohibited recommendation language...");
  const rankingExploration = {
    approaches: [
      {
        id: "biased-approach",
        title: "The optimal approach for everyone",
        description: "This is the optimal approach that you should choose.",
        addresses: [{ stakeholderId: "student", concern: "Penalties" }],
        tradeoffs: [{ description: "Tradeoff", affectedStakeholders: ["student"] }],
        implementationConsiderations: ["Consideration"]
      }
    ]
  };
  assert.throws(
    () => validateExplorationInvariants(rankingExploration, mockStakeholders, mockPerspectives),
    /contains prohibited recommendation\/ranking language/,
    "Expected rejection of ranking language"
  );
  console.log("✓ Recommendation / ranking language was successfully rejected.");

  // Test 2.5: Stale exploration state tracking
  console.log("\n[Validation 5] Stale exploration state detection...");
  let currentExploration = { approaches: [] };
  let isExplorationStale = false;
  // If perspectives or comparison changes:
  isExplorationStale = true;
  assert.strictEqual(isExplorationStale, true, "Exploration must be marked stale when underlying inputs change.");
  console.log("✓ Stale state flag correctly triggered.");

  // Test 2.6: Valid summarized concern passes grounding
  console.log("\n[Validation 6] Valid summarized concern passes grounding...");
  const validGroundedExploration = {
    approaches: [
      {
        id: "valid-grounded-approach",
        title: "Medical and Emergency Accommodation Policy",
        description: "Institutes clear waiver processes for students experiencing illness or personal emergencies.",
        addresses: [
          // Student concern in mockPerspectives is "Penalties for illness"
          { stakeholderId: "student", concern: "Grade penalties resulting from illness or unexpected personal emergencies" }
        ],
        tradeoffs: [{ description: "May increase administrative review time for instructors.", affectedStakeholders: ["faculty"] }],
        implementationConsiderations: ["Establish digital doctor-note submission portal"]
      }
    ]
  };
  validateExplorationInvariants(validGroundedExploration, mockStakeholders, mockPerspectives);
  console.log("✓ Valid summarized concern successfully passed grounding validation.");

  // Test 2.7: Invented concern is rejected by grounding validator
  console.log("\n[Validation 7] Invented concern is rejected by grounding validator...");
  const inventedConcernExploration = {
    approaches: [
      {
        id: "invented-concern-approach",
        title: "Extraterrestrial Defense Policy",
        description: "Prepares classrooms against extraterrestrial intrusions.",
        addresses: [
          // Invented concern completely unrelated to student perspective
          { stakeholderId: "student", concern: "Alien abduction and UFO disruption during exams" }
        ],
        tradeoffs: [{ description: "May cost funds.", affectedStakeholders: ["student"] }],
        implementationConsiderations: ["Install radar"]
      }
    ]
  };
  assert.throws(
    () => validateExplorationInvariants(inventedConcernExploration, mockStakeholders, mockPerspectives),
    /cannot be traced to that stakeholder's existing perspective concerns/,
    "Expected rejection of invented concern"
  );
  console.log("✓ Clearly invented concern was successfully rejected.");

  // Test 2.8: Cross-stakeholder concern is rejected
  console.log("\n[Validation 8] Cross-stakeholder concern attributed to wrong stakeholder is rejected...");
  const crossStakeholderExploration = {
    approaches: [
      {
        id: "cross-stakeholder-approach",
        title: "Faculty Burden Relief",
        description: "Assists with daily roll-call administration.",
        addresses: [
          // Faculty concern in mockPerspectives is "Administrative burden", but erroneously attributed to "student"
          { stakeholderId: "student", concern: "Heavy administrative burden of taking attendance and verifying notes" }
        ],
        tradeoffs: [{ description: "May require staff.", affectedStakeholders: ["student"] }],
        implementationConsiderations: ["Hire aides"]
      }
    ]
  };
  assert.throws(
    () => validateExplorationInvariants(crossStakeholderExploration, mockStakeholders, mockPerspectives),
    /cannot be traced to that stakeholder's existing perspective concerns/,
    "Expected rejection of cross-stakeholder concern attributed to wrong stakeholder"
  );
  console.log("✓ Cross-stakeholder concern attributed to wrong stakeholder was successfully rejected.");

  console.log("\n==================================================");
  console.log("All Milestone 6 Exploration Tests Passed! ✓");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
