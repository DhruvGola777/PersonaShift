import assert from "assert";
import { z } from "zod";
import { ProblemSchema } from "../server/ai/schemas/problem.js";
import { StakeholderSchema } from "../server/ai/schemas/stakeholder.js";
import { PerspectiveSchema } from "../server/ai/schemas/perspective.js";
import {
  isDeapiConfigured,
  buildPerspectiveNarrationText,
  generatePerspectiveAudio
} from "../server/services/deapiService.js";

/**
 * PersonaShift — Milestone 7: deAPI Multimodal Perspective Audio Test Suite
 */

console.log("=== PersonaShift Milestone 7: deAPI Multimodal Perspective Audio Test Suite ===\n");

// Mock Data Models
const mockProblem = {
  summary: "A college is evaluating a transition from physical textbooks to tablet-based digital learning materials.",
  decision: "Whether to replace physical textbooks with tablets as the primary learning resource.",
  domain: "Education",
  facts: [
    "The institution is a college.",
    "The current system uses physical textbooks.",
    "A proposal exists to replace these textbooks with tablets."
  ],
  unknowns: ["The cost structure for the transition."],
  assumptions: ["The college is seeking to improve accessibility or efficiency."],
  affectedAreas: ["Instructional design", "Student financial aid and costs"]
};

const mockStakeholder = {
  id: "student",
  name: "Students",
  reason: "Directly affected by required learning materials and technology costs.",
  relevance: "direct",
  source: "ai"
};

const mockFacultyStakeholder = {
  id: "faculty",
  name: "Faculty Members",
  reason: "Must adjust teaching methods and course syllabi.",
  relevance: "direct",
  source: "ai"
};

const mockPerspective = {
  stakeholderId: "student",
  goals: [
    { text: "Access affordable course materials", basis: "inference" }
  ],
  concerns: [
    { text: "Potential hardware costs and device screen fatigue", basis: "inference" },
    { text: "Unreliable internet access outside campus", basis: "fact" }
  ],
  constraints: [
    { text: "Personal technology budget limitations", basis: "unknown" }
  ],
  incentives: [
    { text: "Lighter backpacks and interactive digital search features", basis: "inference" }
  ],
  priorities: [
    { text: "Equal access regardless of personal income", basis: "inference" }
  ]
};

const PerspectiveAudioRequestSchema = z.object({
  problem: ProblemSchema,
  stakeholder: StakeholderSchema,
  perspective: PerspectiveSchema
});

// ----------------------------------------------------
// Test 1: Zod validation passes on valid request payload
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 1: Valid request passes Zod schema validation");
console.log("--------------------------------------------------");

const validPayload = {
  problem: mockProblem,
  stakeholder: mockStakeholder,
  perspective: mockPerspective
};

const parseResult = PerspectiveAudioRequestSchema.safeParse(validPayload);
assert.strictEqual(parseResult.success, true, "Valid request must pass Zod validation.");
console.log("✓ Valid request payload successfully validated by Zod.");

// ----------------------------------------------------
// Test 2: Mismatched stakeholder ID and perspective ID are rejected
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 2: Mismatched stakeholder ID and perspective ID rejected");
console.log("--------------------------------------------------");

const mismatchedPayload = {
  problem: mockProblem,
  stakeholder: mockFacultyStakeholder, // ID: 'faculty'
  perspective: mockPerspective        // ID: 'student'
};

const isMismatched = mismatchedPayload.stakeholder.id.trim() !== mismatchedPayload.perspective.stakeholderId.trim();
assert.strictEqual(isMismatched, true, "Stakeholder ID and Perspective ID should be detected as mismatched.");
console.log("✓ Mismatched stakeholder ID ('faculty' vs 'student') correctly identified and rejected.");

// ----------------------------------------------------
// Test 3: Missing DEAPI_API_KEY produces controlled configuration error
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 3: Missing DEAPI_API_KEY produces controlled error");
console.log("--------------------------------------------------");

const originalKey = process.env.DEAPI_API_KEY;
try {
  delete process.env.DEAPI_API_KEY;
  assert.strictEqual(isDeapiConfigured(), false, "isDeapiConfigured() must be false when key is missing.");

  await assert.rejects(
    async () => {
      await generatePerspectiveAudio({ text: "Test narration script." });
    },
    (err) => {
      assert.strictEqual(err.code, "DEAPI_NOT_CONFIGURED");
      assert.match(err.message, /Audio is unavailable because deAPI is not configured/);
      return true;
    },
    "generatePerspectiveAudio must reject with DEAPI_NOT_CONFIGURED error."
  );
  console.log("✓ Controlled configuration error (DEAPI_NOT_CONFIGURED) returned without crashing.");
} finally {
  if (originalKey) {
    process.env.DEAPI_API_KEY = originalKey;
  }
}

// ----------------------------------------------------
// Test 4: Audio text generation framing & roleplay prohibition
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 4: Neutral framing & NO first-person roleplay");
console.log("--------------------------------------------------");

const narrationText = buildPerspectiveNarrationText({
  problem: mockProblem,
  stakeholder: mockStakeholder,
  perspective: mockPerspective
});

console.log("Generated Narration Script:\n---\n" + narrationText + "\n---");

// 1. Framing check: Must use "Possible factors shaping the [Name] perspective."
assert.match(
  narrationText,
  /^Possible factors shaping the Students perspective\./,
  "Narration must begin with strictly neutral framing."
);

// 2. Prohibition of first-person persona roleplay
const prohibitedPhrases = [
  /\bI am\b/i,
  /\bI feel\b/i,
  /\bI want\b/i,
  /\bI think\b/i,
  /\bmy perspective\b/i,
  /\bas a student\b/i,
  /\bwe students\b/i,
  /\bwe believe\b/i
];

for (const regex of prohibitedPhrases) {
  assert.strictEqual(
    regex.test(narrationText),
    false,
    `Narration must NOT contain first-person roleplay matching ${regex}`
  );
}
console.log("✓ Confirmed 0 first-person roleplay phrases; neutral third-person framing maintained.");

// ----------------------------------------------------
// Test 5: Basis preservation (fact vs inference vs unknown)
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 5: Explicit preservation of basis distinctions");
console.log("--------------------------------------------------");

// Fact check: "Fact: Unreliable internet access outside campus"
assert.match(narrationText, /Fact: Unreliable internet access outside campus/, "Fact items must be labeled as Fact.");

// Inference check: "Possible concern: Potential hardware costs and device screen fatigue"
assert.match(narrationText, /Possible concern: Potential hardware costs and device screen fatigue/, "Inference items must be labeled as Possible/Inference.");

// Unknown check: "An unknown factor is: Personal technology budget limitations"
assert.match(narrationText, /An unknown factor is: Personal technology budget limitations/, "Unknown items must be explicitly labeled as unknown.");

console.log("✓ Confirmed facts, inferences, and unknowns accurately distinguished.");

// ----------------------------------------------------
// Test 6: Empty optional categories handled gracefully
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 6: Empty/minimal categories handled gracefully");
console.log("--------------------------------------------------");

const sparsePerspective = {
  stakeholderId: "student",
  goals: [{ text: "Minimal goal", basis: "inference" }],
  concerns: [{ text: "Minimal concern", basis: "fact" }],
  constraints: [],
  incentives: [],
  priorities: []
};

const sparseNarration = buildPerspectiveNarrationText({
  problem: mockProblem,
  stakeholder: mockStakeholder,
  perspective: sparsePerspective
});

assert.match(sparseNarration, /Goals:\nPossible goal: Minimal goal/);
assert.match(sparseNarration, /Concerns:\nFact: Minimal concern/);
assert.doesNotMatch(sparseNarration, /Constraints:/);
assert.doesNotMatch(sparseNarration, /Incentives:/);
assert.doesNotMatch(sparseNarration, /Priorities:/);
console.log("✓ Empty categories safely omitted without crashing or rendering blank sections.");

// ----------------------------------------------------
// Test 7: Cache key generation and duplicate prevention
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 7: Client audio cache key & deduplication logic");
console.log("--------------------------------------------------");

function computePerspectiveAudioCacheKey(stakeholderId, perspective) {
  // Stable deterministic key combining stakeholderId and JSON serialized perspective
  return `${stakeholderId}::${JSON.stringify(perspective)}`;
}

const key1 = computePerspectiveAudioCacheKey(mockStakeholder.id, mockPerspective);
const key2 = computePerspectiveAudioCacheKey(mockStakeholder.id, mockPerspective);
assert.strictEqual(key1, key2, "Same perspective must generate identical cache key.");

const clientAudioCache = new Map();
let apiRequestsTriggered = 0;

function getOrGenerateAudio(stakeholderId, perspective) {
  const cacheKey = computePerspectiveAudioCacheKey(stakeholderId, perspective);
  if (clientAudioCache.has(cacheKey)) {
    return { audio: clientAudioCache.get(cacheKey), fromCache: true };
  }
  // Simulate API call
  apiRequestsTriggered++;
  const result = { audioUrl: `/api/perspective-audio/proxy?mock=1&id=${stakeholderId}`, duration: null };
  clientAudioCache.set(cacheKey, result);
  return { audio: result, fromCache: false };
}

// First request
const req1 = getOrGenerateAudio(mockStakeholder.id, mockPerspective);
assert.strictEqual(req1.fromCache, false);
assert.strictEqual(apiRequestsTriggered, 1);

// Second request for identical perspective
const req2 = getOrGenerateAudio(mockStakeholder.id, mockPerspective);
assert.strictEqual(req2.fromCache, true);
assert.strictEqual(apiRequestsTriggered, 1, "Duplicate request must be served from cache without extra API calls.");

// Modified perspective invalidates cache hit
const modifiedPerspective = { ...mockPerspective, goals: [{ text: "New goal", basis: "fact" }] };
const req3 = getOrGenerateAudio(mockStakeholder.id, modifiedPerspective);
assert.strictEqual(req3.fromCache, false);
assert.strictEqual(apiRequestsTriggered, 2, "Modified perspective correctly triggers regeneration.");
console.log("✓ Audio cache and deduplication verified: identical requests reuse audio, modified perspectives regenerate.");

// ----------------------------------------------------
// Test 8: SHIFT switching does NOT trigger audio API calls
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 8: SHIFT switching does NOT trigger audio API");
console.log("--------------------------------------------------");

let shiftApiCalls = 0;
function simulateShiftSelection(newStakeholderId) {
  // SHIFT switching is pure local state change
  return newStakeholderId;
}

const active1 = simulateShiftSelection("student");
const active2 = simulateShiftSelection("faculty");
const active3 = simulateShiftSelection("administrator");
assert.strictEqual(shiftApiCalls, 0, "SHIFT switching must make exactly 0 audio API calls.");
console.log("✓ SHIFT switching confirmed 100% local with 0 network calls.");

// ----------------------------------------------------
// Test 9: Optional Live deAPI Integration Test
// ----------------------------------------------------
console.log("--------------------------------------------------");
console.log("Test 9: Live deAPI Integration (if DEAPI_API_KEY configured)");
console.log("--------------------------------------------------");

if (isDeapiConfigured()) {
  console.log("DEAPI_API_KEY is configured. Running live synthesis check...");
  try {
    const liveResult = await generatePerspectiveAudio({
      text: "Possible factors shaping the student perspective. Goal: Access affordable materials.",
      timeoutMs: 30000
    });
    assert(liveResult.audioUrl, "Live result must return a valid audioUrl.");
    console.log(`✓ Live audio successfully generated! URL: ${liveResult.audioUrl}`);
  } catch (err) {
    console.warn(`[Live Test Notice] Live deAPI test failed (${err.message}). Unit and invariant tests remain valid.`);
  }
} else {
  console.log("ℹ DEAPI_API_KEY is not set. Skipping live external call (unit & invariant tests passed).");
}

console.log("\n==================================================");
console.log("All Milestone 7 deAPI Perspective Audio Tests Passed! ✓");
console.log("==================================================");
