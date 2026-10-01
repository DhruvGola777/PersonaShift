# PersonaShift

> General-purpose perspective-mapping and decision-exploration tool.

## Milestone 2: Stakeholder Engine (Discovery + User Verification)

PersonaShift maps perspectives around complex decisions. In Milestone 2, the system takes the structured `ProblemModel` produced in Milestone 1 and identifies 4–8 high-value stakeholders across three relevance tiers:
- **Direct**: Experiences the effects directly.
- **Indirect**: Experiences secondary or downstream consequences.
- **System**: Operates, regulates, funds, maintains, or governs part of the system.

The AI proposes initial stakeholders, but the **user has final authority**. Users can keep, edit, remove, or add custom stakeholders before confirming the final list that will feed into the Perspective Engine.

---

## Architecture & Technology Stack

- **Frontend**: React + JavaScript + Vite (minimal, functional UI)
- **Backend**: Node.js + Express
- **AI**: Google Gemini via `@google/genai` (structured JSON schema output)
- **Validation**: Zod (runtime validation ensuring no unvalidated model output reaches the frontend)
- **Error Handling**: Graceful retries on model generation or validation failure, clean HTTP errors without leaking sensitive internal details or keys.

### Project Structure

```
personashift/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── ai/
│   │   ├── gemini.js           # Dedicated Gemini client & structured output config
│   │   ├── prompts/
│   │   │   └── problemParser.js # Dedicated Problem Parser system prompt & rules
│   │   └── schemas/
│   │       └── problem.js       # Zod ProblemSchema & Gemini JSON schema
│   │
│   ├── services/
│   │   └── problemParser.js    # Problem Parser service orchestration with retry logic
│   │
│   ├── routes/
│   │   └── analyze.js          # POST /api/analyze endpoint with validation & error handling
│   │
│   └── server.js               # Express application setup, CORS, and GET /api/health
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A Google Gemini API key (obtainable from [Google AI Studio](https://aistudio.google.com/))

### 2. Installation

Install all backend and frontend dependencies:

```bash
npm install
npm --prefix client install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Open `.env` and set your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
GEMINI_MODEL=gemini-2.5-flash
```

### 4. Running the Application

In one terminal, start the Express backend server:

```bash
npm run dev:server
```

In a second terminal, start the Vite frontend dev server:

```bash
npm run client
```

Open your browser at `http://localhost:5173`.

---

## API Reference

### Health Check

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "ok": true,
  "service": "personashift-api"
}
```

### Analyze Problem

```http
POST /api/analyze
Content-Type: application/json
```

**Request Payload:**
```json
{
  "problem": "Our college is considering replacing physical textbooks with tablets."
}
```

**Response (200 OK):**
```json
{
  "problem": {
    "summary": "The college is evaluating transitioning from traditional physical textbooks to digital tablets for students.",
    "decision": "Whether to replace physical textbooks with tablets across the college.",
    "domain": "Education",
    "facts": [
      "The institution is a college.",
      "The college is considering replacing physical textbooks with tablets."
    ],
    "unknowns": [
      "Who will bear the financial cost of purchasing the tablets?",
      "Will tablets replace all textbooks or only select subjects?",
      "What technical infrastructure and internet connectivity exist on campus?"
    ],
    "assumptions": [
      "Students currently use traditional physical textbooks.",
      "Digital textbooks are available for the curriculum."
    ],
    "affectedAreas": [
      "Curriculum and pedagogy",
      "Student learning experience and screen time",
      "Institutional budget and procurement",
      "Campus IT infrastructure and technical support"
    ]
  }
}
```

### Discover Stakeholders

```http
POST /api/stakeholders
Content-Type: application/json
```

**Request Payload:**
```json
{
  "problem": {
    "summary": "...",
    "decision": "...",
    "domain": "...",
    "facts": [],
    "unknowns": [],
    "assumptions": [],
    "affectedAreas": []
  }
}
```

**Response (200 OK):**
```json
{
  "stakeholders": [
    {
      "id": "students",
      "name": "Students",
      "reason": "Directly affected by mandatory attendance requirements affecting scheduling and academic grading.",
      "relevance": "direct",
      "source": "ai"
    }
  ]
}
```

### Error Handling

The API returns appropriate HTTP status codes and user-friendly error messages:

- `400 Bad Request`: If the problem input is missing, empty, or malformed.
  ```json
  {
    "error": "Please provide a problem description."
  }
  ```
- `500 Internal Server Error`: Clean error message returned when an upstream AI error or validation failure persists after a retry. API keys and stack traces are never exposed to the client.

---

## Problem Parser Rules

1. Create a concise, neutral summary of the situation.
2. Identify the decision, change, or question being considered.
3. Classify the problem into a broad domain.
4. Put information explicitly stated by the user into `facts`.
5. Put important information that is missing into `unknowns`.
6. Put reasonable interpretations or implications into `assumptions`.
7. Never present an assumption as a fact.
8. Never invent statistics, names, motivations, or demographics.
9. Identify broad areas that could potentially be affected.
10. Keep the analysis general enough for subsequent stakeholder analysis.
11. Do not recommend a decision or judge if it is good or bad.
12. Do not claim that an entire group thinks or behaves in one particular way.
