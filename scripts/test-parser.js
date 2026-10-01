import dotenv from "dotenv";
dotenv.config();

import { analyzeProblem } from "../server/services/problemParser.js";

const testProblems = [
  {
    name: "Primary College Test",
    problem: "Our college is considering replacing physical textbooks with tablets."
  },
  {
    name: "Test A: Startup Backend",
    problem: "Our startup is considering rewriting its backend."
  },
  {
    name: "Test B: Pedestrian Zone",
    problem: "The city is considering converting a major road into a pedestrian-only zone."
  },
  {
    name: "Test C: Single-Use Plastic",
    problem: "Our university wants to eliminate single-use plastic."
  },
  {
    name: "Test D: SaaS Subscription",
    problem: "A SaaS company is considering introducing a paid subscription."
  }
];

async function runTests() {
  console.log("=== PersonaShift Problem Parser Test Suite ===\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env.");
    console.error("Please add your Gemini API key to .env and run this script again.");
    process.exit(1);
  }

  for (let i = 0; i < testProblems.length; i++) {
    const { name, problem } = testProblems[i];
    console.log(`--------------------------------------------------`);
    console.log(`[${i + 1}/${testProblems.length}] Running: ${name}`);
    console.log(`Input: "${problem}"`);
    console.log(`--------------------------------------------------`);

    try {
      const startTime = Date.now();
      const result = await analyzeProblem(problem);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✓ Completed in ${elapsed}s`);
      console.log(JSON.stringify(result, null, 2));
      console.log();

      // Brief delay between calls to respect rate limits
      if (i < testProblems.length - 1) {
        await new Promise(r => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`✗ Test failed for "${name}":`, err.message);
      if (err.cause) console.error("Cause:", err.cause);
      process.exit(1);
    }
  }

  console.log("==================================================");
  console.log("All 5 test problems parsed and validated successfully!");
  console.log("==================================================");
}

runTests();
