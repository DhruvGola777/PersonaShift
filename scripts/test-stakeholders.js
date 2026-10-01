import dotenv from "dotenv";
dotenv.config();

import { analyzeProblem } from "../server/services/problemParser.js";
import { discoverStakeholders } from "../server/services/stakeholderEngine.js";

const testProblems = [
  {
    name: "Problem 1: Mandatory Attendance",
    problem: "Our college is considering making attendance mandatory."
  },
  {
    name: "Problem 2: Startup Backend Rewrite",
    problem: "Our startup is considering rewriting its backend."
  },
  {
    name: "Problem 3: Pedestrian Zone",
    problem: "The city is considering converting a major road into a pedestrian-only zone."
  },
  {
    name: "Problem 4: Single-Use Plastic",
    problem: "Our university wants to eliminate single-use plastic."
  },
  {
    name: "Problem 5: SaaS Subscription",
    problem: "A SaaS company is considering introducing a paid subscription."
  }
];

async function runTests() {
  console.log("=== PersonaShift Milestone 2: Stakeholder Engine Test Suite ===\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.");
    process.exit(1);
  }

  for (let i = 0; i < testProblems.length; i++) {
    const { name, problem } = testProblems[i];
    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${testProblems.length}] Testing: ${name}`);
    console.log(`Input: "${problem}"`);
    console.log(`--------------------------------------------------`);

    try {
      // 1. Problem Parser
      const startTime = Date.now();
      const parsedProblem = await analyzeProblem(problem);
      console.log(`✓ Problem parsed (Domain: ${parsedProblem.domain}, Decision: "${parsedProblem.decision}")`);

      // 2. Stakeholder Engine
      const stakeholders = await discoverStakeholders(parsedProblem);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✓ Identified ${stakeholders.length} stakeholders in ${elapsed}s:`);
      stakeholders.forEach((s, idx) => {
        console.log(`  ${idx + 1}. [${s.relevance.toUpperCase()}] ${s.name} (${s.id})`);
        console.log(`     Reason: ${s.reason}`);
      });
      console.log();

      if (i < testProblems.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`✗ Test failed for "${name}":`, err.message);
      if (err.cause) console.error("Cause:", err.cause);
      process.exit(1);
    }
  }

  console.log("==================================================");
  console.log("All 5 Milestone 2 tests passed successfully!");
  console.log("==================================================");
}

runTests();
