# PersonaShift

> An interactive perspective-mapping and decision-exploration system that helps human decision-makers explore complex dilemmas through multi-stakeholder analysis, tension discovery, grounded alternative exploration, and multimodal narration.

---

## What It Does

PersonaShift transforms ambiguous, high-stakes decisions into structured, multi-dimensional perspectives without automating away human judgment.

Instead of outputting a single "recommendation" or picking a "winner," PersonaShift maps the human and operational landscape of a decision through a disciplined 7-stage analytical pipeline:

```
[ Problem Description ]
          ↓
[ Problem Parser ] ──▶ Distinguishes Facts, Unknowns, Assumptions, and Affected Areas
          ↓
[ Stakeholder Engine ] ──▶ Discovers Direct, Indirect, and System Stakeholders
          ↓
[ User Review ] ──▶ Human-in-the-loop authority: Keep, Edit, Add, Remove, and Confirm
          ↓
[ Perspective Engine ] ──▶ Generates Goals, Concerns, Constraints, Incentives, Priorities
          ↓
[ SHIFT Experience ] ──▶ Zero-latency interactive switching between stakeholder lenses
          ↓
[ Multimodal Audio ] ──▶ Optional deAPI-powered neutral audio narration ("Hear this perspective")
          ↓
[ Comparison Engine ] ──▶ Surfaces Shared Goals, Different Priorities, Tensions, & Dependencies
          ↓
[ Exploration Engine ] ──▶ Generates grounded alternative approaches with trade-offs & considerations
```

### The Analytical Stages

1. **Problem Parser**: Converts raw natural-language decision problems into a structured `ProblemModel` separating explicit facts from unknowns and assumptions.
2. **Stakeholder Engine & User Review**: Identifies affected parties with clear rationale and relevance categories (`direct`, `indirect`, `system`). Users have complete authority to edit, add custom stakeholders, exclude suggestions, and finalize the list.
3. **Perspective Engine**: Generates structured perspective models covering five core categories for each confirmed stakeholder:
   - **Goals**: Potential outcomes that matter to this stakeholder.
   - **Concerns**: Potential downsides, risks, or frictions.
   - **Constraints**: Conditions or limitations binding this stakeholder.
   - **Incentives**: Factors shaping behavior or positioning.
   - **Priorities**: What is prioritized when evaluating the decision.
4. **SHIFT Experience**: The signature interaction of PersonaShift. Users switch instantly between stakeholder viewpoints to understand how the same problem looks from different seats, preserving decision context at all times with zero network overhead.
5. **Hear Perspective (deAPI Multimodal Audio)**: An optional multimodal layer that synthesizes a neutral, objective, third-person audio narration of an active perspective using deAPI's text-to-speech engine.
6. **Comparison Engine**: Analyzes across perspectives to surface cross-cutting dynamics:
   - **Shared Goals**: Overlapping outcomes valued by multiple stakeholders.
   - **Different Priorities**: Areas where priorities pull in distinct directions.
   - **Potential Tensions**: Situations where priorities may create friction or conflict.
   - **Dependencies**: Situations where one stakeholder's outcome depends on another.
7. **Exploration Engine**: Generates distinct alternative approaches to address identified tensions. Every addressed concern is strictly grounded in existing stakeholder perspective models. Approaches highlight trade-offs and implementation considerations without ranking or scoring.

---

## Why It Is Different

1. **Not a Chatbot**: PersonaShift is an interactive perspective-mapping tool with structured models and dedicated analytical views, not an open-ended conversational chat assistant.
2. **No "Winner" or Prescription**: The system never ranks stakeholders, picks sides, or prescribes what the user "should" do. The human user retains ultimate decision-making responsibility.
3. **Transparent Epistemic Basis**: Every perspective element is explicitly labeled with its evidentiary status:
   - `[FACT]`: Explicitly stated in the source problem.
   - `[INFERENCE]`: Plausible contextual factor derived from domain knowledge.
   - `[UNKNOWN]`: Recognized information gap that cannot be asserted as fact.
4. **Anti-Hallucination & Concern Grounding**: Approaches generated during Exploration must strictly map to verified concerns already established in confirmed stakeholder perspectives; invented or cross-stakeholder concerns are rejected.
5. **Zero-Latency Perspective Lenses**: Switching between stakeholders during the SHIFT experience is 100% client-side with zero additional API calls or token usage.

---

## Technology Stack

- **Frontend**:
  - React 18
  - Vanilla CSS (custom design system, responsive breakpoints, high-contrast accessible tokens)
  - Vite (build tool & local development server)
- **Backend**:
  - Node.js (ES Modules)
  - Express (REST API)
  - Zod (strict runtime schema validation)
  - Node Native Fetch & Custom Secure Audio Proxy
- **AI & Language Intelligence**:
  - Google Gemini (`gemini-2.5-flash`) via the official `@google/genai` SDK
  - Structured JSON outputs enforced by JSON Schema
- **Multimodal Audio Layer**:
  - deAPI Text-to-Speech API (`https://api.deapi.ai/api/v2/tts`)
  - Server-side HTTPS audio streaming proxy (`/api/perspective-audio/proxy`) hardened against SSRF

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (React)                        │
│  - SHIFT Perspective Selector  - Comparison & Tensions View │
│  - Multimodal Audio Player     - Exploration & Trade-offs   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express Backend Server                   │
│  ├── POST /api/analyze                                      │
│  ├── POST /api/stakeholders                                 │
│  ├── POST /api/perspectives                                 │
│  ├── POST /api/compare                                      │
│  ├── POST /api/explore                                      │
│  ├── POST /api/perspective-audio                            │
│  └── GET  /api/perspective-audio/proxy (SSRF Protected)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│         Google Gemini        │ │            deAPI           │
│  - Structured Reasoning      │ │  - Multimodal Text-to-    │
│  - Perspective Generation    │ │    Speech Narration        │
│  - Comparative Synthesis     │ │  - Secure S3 Result Host   │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## The Trust Model

PersonaShift enforces a strict trust model across all prompts and UI views:

- **No First-Person Roleplay**: The system never uses *"I am a student..."* or speaks in character. All perspective analyses and narrations use neutral third-person framing (*"Possible factors shaping the Students perspective"*).
- **No Universal Generalizations**: Groups are never treated as homogeneous monoliths. Language reflects possibilities rather than sweeping assertions (*"May prioritize..."*, *"Could be concerned about..."*).
- **Preserved Epistemic Distinctions**: Inferences are never converted into facts, and unknowns are made explicit rather than filled with hallucinated details.
- **SSRF Protection on Proxy**: The `/api/perspective-audio/proxy` endpoint strictly validates targets: only `https://` URLs pointing exactly to `results.deapi.ai` on port 443 are allowed. Loopback, private IP ranges, metadata endpoints, and lookalike domains are rejected with HTTP 403.

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))
- A **deAPI API Key** (from [deAPI Developer Console](https://deapi.ai/))

### 2. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/DhruvGola777/PersonaShift.git
cd PersonaShift
npm run install:all
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure your API keys in `.env`:

```env
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# deAPI Multimodal Perspective Audio Configuration
DEAPI_API_KEY=your_deapi_api_key_here
DEAPI_TTS_MODEL=deapi-tts-1
DEAPI_VOICE=aura-asteria-en

# Server Configuration
PORT=3001
```

### 4. Running Locally

Start the backend server and client dev server:

```bash
# Terminal 1: Start Express API server (with file watching)
npm run dev:server

# Terminal 2: Start Vite client dev server
npm run client
```

Open `http://localhost:5173` in your browser.

---

## Testing & Verification

PersonaShift includes automated test suites covering every milestone:

```bash
# Test 1: Problem Parser (structured extraction, facts/unknowns)
npm run test:parser

# Test 2: Stakeholder Engine (relevance taxonomy, discovery)
npm run test:stakeholders

# Test 3: Perspective Engine (5 categories, epistemic basis tracking)
npm run test:perspectives

# Test 4: SHIFT Experience (zero-latency switching, fallback, context preservation)
npm run test:shift

# Test 5: Comparison Engine (shared goals, priorities, tensions, dependencies)
npm run test:comparison

# Test 6: Exploration Engine (concern grounding, trade-offs, invariant validation)
npm run test:exploration

# Test 7: deAPI Perspective Audio & SSRF Security (neutral script, live TTS, proxy protection)
npm run test:deapi

# Build client bundle for production
npm run client:build
```

---

## Hackathon Development (LovHack Season 3)

PersonaShift was designed and developed during **LovHack Season 3** as an exploratory perspective-mapping tool.

All milestones were created sequentially and validated with automated regression tests:
- **Milestone 1**: Project Foundation + Problem Parser
- **Milestone 2**: Stakeholder Engine + User Review
- **Milestone 3**: Perspective Engine + Uncertainty Tracking
- **Milestone 4**: SHIFT Experience + Zero-Latency Perspective Switching
- **Milestone 5**: Comparison Engine + Tensions & Dependencies
- **Milestone 6**: Exploration Engine + Grounded Alternative Approaches
- **Milestone 7**: deAPI Multimodal Perspective Audio Narration
- **Milestone 8**: Final Polish, Accessibility, SSRF Hardening, and Submission Readiness

### Sponsor Integration (deAPI)
PersonaShift meaningfully utilizes **deAPI** for its multimodal layer. Rather than using deAPI as a reasoning model (which is handled by Google Gemini), PersonaShift leverages deAPI's text-to-speech API to produce objective audio narrations of structured perspective factors, allowing users to audibly absorb perspectives while preserving neutral third-person framing.

---

## License

MIT
