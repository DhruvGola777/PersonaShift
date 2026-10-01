import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRouter from "./routes/analyze.js";
import stakeholdersRouter from "./routes/stakeholders.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "personashift-api"
  });
});

// API Routes
app.use("/api", analyzeRouter);
app.use("/api", stakeholdersRouter);

// Global Error Handler (handles malformed JSON payloads and unexpected errors)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON payload in request."
    });
  }

  console.error("[ServerError]:", err.message || err);
  return res.status(500).json({
    error: "Internal server error."
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PersonaShift API server listening on http://localhost:${PORT}`);
});

export default app;
