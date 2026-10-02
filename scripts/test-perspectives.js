import dotenv from "dotenv";
dotenv.config();

import { analyzeProblem } from "../server/services/problemParser.js";
import { generatePerspectives } from "../server/services/perspectiveEngine.js";

const scenarios = [
  {
    name: "Test 1 — Education",
    problemText: "Our college is considering making attendance mandatory for all students.",
    stakeholders: [
      { id: "student", name: "Student", reason: "Directly affected by attendance requirements and penalties.", relevance: "direct", source: "ai" },
      { id: "teacher", name: "Teacher", reason: "Responsible for tracking attendance and enforcing the policy in class.", relevance: "direct", source: "ai" },
      { id: "administrator", name: "College Administrator", reason: "Responsible for institutional policy design and resource allocation.", relevance: "system", source: "ai" },
      { id: "parent", name: "Parent", reason: "May be invested in the student's academic progress and graduation timeline.", relevance: "indirect", source: "ai" }
    ]
  },
  {
    name: "Test 2 — Urban Planning",
    problemText: "The municipal government is evaluating a proposal to transition a primary urban thoroughfare into a pedestrian-exclusive zone.",
    stakeholders: [
      { id: "pedestrians", name: "Pedestrians", reason: "Directly gain walkable public space and car-free transit.", relevance: "direct", source: "ai" },
      { id: "local-businesses", name: "Local Businesses", reason: "Affected by changes in delivery access and customer foot traffic.", relevance: "direct", source: "ai" },
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

async function runTests() {
  console.log("=== PersonaShift Milestone 3: Perspective Engine Test Suite ===\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.");
    process.exit(1);
  }

  for (let i = 0; i < scenarios.length; i++) {
    const { name, problemText, stakeholders } = scenarios[i];
    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${scenarios.length}] Running: ${name}`);
    console.log(`Problem: "${problemText}"`);
    console.log(`Confirmed Stakeholders (${stakeholders.length}): ${stakeholders.map(s => s.name).join(", ")}`);
    console.log(`--------------------------------------------------`);

    try {
      const startTime = Date.now();

      // 1. Parse problem
      const problem = await analyzeProblem(problemText);
      console.log(`✓ Problem parsed (Domain: "${problem.domain}")`);

      // 2. Generate perspectives
      const perspectives = await generatePerspectives(problem, stakeholders);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✓ Generated ${perspectives.length} perspectives in ${elapsed}s`);

      // Validate exactly one per stakeholder
      if (perspectives.length !== stakeholders.length) {
        throw new Error(`Expected ${stakeholders.length} perspectives, got ${perspectives.length}`);
      }

      // Check each perspective
      for (const s of stakeholders) {
        const p = perspectives.find(item => item.stakeholderId === s.id);
        if (!p) {
          throw new Error(`Missing perspective for stakeholder "${s.id}" (${s.name})`);
        }

        console.log(`\n  ▶ Stakeholder: ${s.name} [ID: ${s.id}]`);

        const categories = ["goals", "concerns", "constraints", "incentives", "priorities"];
        for (const cat of categories) {
          console.log(`    ${cat.toUpperCase()} (${p[cat].length}):`);
          for (const item of p[cat]) {
            console.log(`      - [${item.basis.toUpperCase()}] ${item.text}`);
            if (!["fact", "inference", "unknown"].includes(item.basis)) {
              throw new Error(`Invalid basis "${item.basis}"`);
            }
          }
        }
      }

      console.log(`\n✓ All invariants passed for ${name}!\n`);

      if (i < scenarios.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`✗ Test failed for "${name}":`, err.message);
      if (err.cause) console.error("Cause:", err.cause);
      process.exit(1);
    }
  }

  console.log("==================================================");
  console.log("All Milestone 3 Perspective Engine tests passed successfully!");
  console.log("==================================================");
}

runTests();
