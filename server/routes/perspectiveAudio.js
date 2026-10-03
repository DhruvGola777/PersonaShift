import express from "express";
import { z } from "zod";
import { ProblemSchema } from "../ai/schemas/problem.js";
import { StakeholderSchema } from "../ai/schemas/stakeholder.js";
import { PerspectiveSchema } from "../ai/schemas/perspective.js";
import {
  isDeapiConfigured,
  buildPerspectiveNarrationText,
  generatePerspectiveAudio
} from "../services/deapiService.js";

const router = express.Router();

// Request validation schema for perspective audio generation
const PerspectiveAudioRequestSchema = z.object({
  problem: ProblemSchema,
  stakeholder: StakeholderSchema,
  perspective: PerspectiveSchema
});

/**
 * POST /api/perspective-audio
 *
 * Generates neutral multimodal narration audio for a confirmed stakeholder perspective using deAPI.
 */
router.post("/perspective-audio", async (req, res) => {
  // 1. Zod schema validation
  const parseResult = PerspectiveAudioRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    return res.status(400).json({
      error: `Invalid request payload: ${errorDetails}`,
      details: parseResult.error.format()
    });
  }

  const { problem, stakeholder, perspective } = parseResult.data;

  // 2. Validate stakeholder ID correspondence
  if (stakeholder.id.trim() !== perspective.stakeholderId.trim()) {
    return res.status(400).json({
      error: `Stakeholder ID "${stakeholder.id}" does not match perspective stakeholderId "${perspective.stakeholderId}".`
    });
  }

  // 3. Check deAPI configuration
  if (!isDeapiConfigured()) {
    return res.status(503).json({
      error: "Audio is unavailable because deAPI is not configured.",
      code: "DEAPI_NOT_CONFIGURED"
    });
  }

  try {
    // 4. Deterministically generate narration text without extra AI reasoning
    const narrationText = buildPerspectiveNarrationText({
      problem,
      stakeholder,
      perspective
    });

    // 5. Call deAPI TTS service
    const result = await generatePerspectiveAudio({ text: narrationText });

    // Use proxy route for guaranteed browser playback without CORS or signature complications
    const proxiedAudioUrl = `/api/perspective-audio/proxy?url=${encodeURIComponent(result.audioUrl)}`;

    return res.status(200).json({
      audioUrl: proxiedAudioUrl,
      directUrl: result.audioUrl,
      duration: result.duration || null,
      narrationText
    });
  } catch (err) {
    console.error("[PerspectiveAudioRoute] Error:", err.message || err);

    if (err.code === "DEAPI_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "Audio is unavailable because deAPI is not configured.",
        code: "DEAPI_NOT_CONFIGURED"
      });
    }

    return res.status(err.status || 500).json({
      error: err.message || "Failed to generate perspective audio.",
      code: err.code || "AUDIO_GENERATION_FAILED"
    });
  }
});

export const TRUSTED_AUDIO_HOST = "results.deapi.ai";

/**
 * Validates whether a target audio URL strictly belongs to trusted deAPI results storage.
 * Prevents SSRF attacks against localhost, internal networks, or arbitrary external domains.
 *
 * @param {string} urlString
 * @returns {boolean}
 */
export function isTrustedAudioResultUrl(urlString) {
  if (!urlString || typeof urlString !== "string") return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname.toLowerCase() !== TRUSTED_AUDIO_HOST) return false;
    if (parsed.port && parsed.port !== "443") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * GET /api/perspective-audio/proxy
 *
 * Securely proxies audio streams strictly from results.deapi.ai to the client
 * to eliminate browser CORS restrictions and header mismatch issues.
 */
router.get("/perspective-audio/proxy", async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).json({ error: "Missing audio url parameter." });
  }

  // Strict SSRF protection: only allow HTTPS requests to results.deapi.ai
  if (!isTrustedAudioResultUrl(targetUrl)) {
    return res.status(403).json({
      error: `Access denied. Target URL host must strictly be "${TRUSTED_AUDIO_HOST}" with HTTPS.`,
      code: "UNTRUSTED_PROXY_TARGET"
    });
  }

  try {
    const audioRes = await fetch(targetUrl);
    if (!audioRes.ok) {
      return res.status(audioRes.status).json({ error: "Failed to fetch audio stream from upstream." });
    }

    res.setHeader("Content-Type", audioRes.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");

    const arrayBuffer = await audioRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("[PerspectiveAudioProxy] Error:", err.message);
    return res.status(500).json({ error: "Proxy stream failed." });
  }
});

export default router;
