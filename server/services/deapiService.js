/**
 * PersonaShift — deAPI Perspective Audio Service (Milestone 7)
 *
 * Provides deterministic perspective narration text generation and
 * multimodal TTS synthesis via deAPI v2 audio speech API.
 *
 * Trust Principles & Invariants:
 * - Strictly neutral narration: "Possible factors shaping the [Stakeholder] perspective"
 * - NO first-person roleplay ("I am...", "I feel...", "My goal is...")
 * - NO invented emotions, opinions, demographics, or external claims
 * - Preserves explicit basis distinctions (fact vs inference vs unknown)
 * - Deterministic text assembly from validated PerspectiveModel without extra AI reasoning calls
 * - Async deAPI v2 submission and polling
 */

const DEAPI_BASE_URL = "https://api.deapi.ai";
const DEFAULT_MODEL = "Kokoro";
const DEFAULT_VOICE = "af_sky";

/**
 * Checks whether deAPI API key is present in server environment.
 * @returns {boolean}
 */
export function isDeapiConfigured() {
  const key = process.env.DEAPI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

const SINGULAR_CATEGORY_LABELS = {
  Goals: "goal",
  Concerns: "concern",
  Constraints: "constraint",
  Incentives: "incentive",
  Priorities: "priority"
};

/**
 * Helper to render an individual perspective item with strict basis preservation.
 *
 * @param {string} categoryLabel
 * @param {object} item - { text, basis }
 * @returns {string}
 */
function renderItemText(categoryLabel, item) {
  const text = item.text.trim();
  const singular = SINGULAR_CATEGORY_LABELS[categoryLabel] || categoryLabel.toLowerCase();
  switch (item.basis) {
    case "fact":
      return `Fact: ${text}`;
    case "inference":
      return `Possible ${singular}: ${text}`;
    case "unknown":
      return `An unknown factor is: ${text}`;
    default:
      return `${categoryLabel}: ${text}`;
  }
}

/**
 * Deterministically constructs a concise, neutral narration text from an existing structured perspective.
 * Does NOT invoke any LLM. Only uses confirmed stakeholder information and validated perspective items.
 *
 * Target narration time: roughly 20-40 seconds.
 *
 * @param {object} params
 * @param {object} params.problem - The ProblemModel
 * @param {object} params.stakeholder - The ConfirmedStakeholder
 * @param {object} params.perspective - The PerspectiveModel
 * @returns {string} The assembled narration script.
 */
export function buildPerspectiveNarrationText({ problem, stakeholder, perspective }) {
  if (!stakeholder || !stakeholder.name) {
    throw new Error("Cannot construct perspective narration without a valid stakeholder.");
  }
  if (!perspective) {
    throw new Error("Cannot construct perspective narration without a valid perspective.");
  }

  const stakeholderName = stakeholder.name.trim();

  // Neutral framing: never "What the stakeholder thinks" or first-person roleplay
  const sections = [
    `Possible factors shaping the ${stakeholderName} perspective.`
  ];

  // Helper to append non-empty category items
  const appendCategory = (categoryName, items) => {
    if (Array.isArray(items) && items.length > 0) {
      sections.push(`${categoryName}:`);
      for (const item of items) {
        if (item && item.text) {
          sections.push(renderItemText(categoryName, item));
        }
      }
    }
  };

  appendCategory("Goals", perspective.goals);
  appendCategory("Concerns", perspective.concerns);
  appendCategory("Constraints", perspective.constraints);
  appendCategory("Incentives", perspective.incentives);
  appendCategory("Priorities", perspective.priorities);

  return sections.join("\n");
}

/**
 * Submits a text-to-speech job to deAPI and polls for the result.
 *
 * @param {object} options
 * @param {string} options.text - The narration text to synthesize
 * @param {string} [options.model] - Optional override for TTS model (defaults to Kokoro)
 * @param {string} [options.voice] - Optional override for TTS voice (defaults to af_sky)
 * @param {number} [options.pollIntervalMs=1500] - Polling interval in ms
 * @param {number} [options.timeoutMs=60000] - Maximum wait time in ms
 * @returns {Promise<{ audioUrl: string, duration: null, requestId: string }>}
 */
export async function generatePerspectiveAudio({
  text,
  model,
  voice,
  pollIntervalMs = 1500,
  timeoutMs = 60000
}) {
  if (!isDeapiConfigured()) {
    const error = new Error("Audio is unavailable because deAPI is not configured.");
    error.code = "DEAPI_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }

  const apiKey = process.env.DEAPI_API_KEY.trim();
  const selectedModel = model || process.env.DEAPI_TTS_MODEL || DEFAULT_MODEL;
  const selectedVoice = voice || process.env.DEAPI_TTS_VOICE || DEFAULT_VOICE;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    throw new Error("Narration text is required for audio synthesis.");
  }

  // 1. Submit asynchronous TTS job (multipart/form-data required by deAPI v2 audio/speech)
  const formData = new FormData();
  formData.append("text", text.trim());
  formData.append("model", selectedModel);
  formData.append("lang", "en-us");
  formData.append("speed", "1");
  formData.append("format", "mp3");
  formData.append("sample_rate", "24000");
  formData.append("mode", "custom_voice");
  formData.append("voice", selectedVoice);

  let submitRes;
  try {
    submitRes = await fetch(`${DEAPI_BASE_URL}/api/v2/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json"
      },
      body: formData
    });
  } catch (err) {
    const networkError = new Error(`Failed to connect to deAPI service: ${err.message}`);
    networkError.code = "DEAPI_NETWORK_ERROR";
    throw networkError;
  }

  const submitJson = await submitRes.json().catch(() => null);

  if (!submitRes.ok) {
    const errMsg = submitJson?.message || submitJson?.error || `HTTP ${submitRes.status}`;
    const apiError = new Error(`deAPI speech submission failed: ${errMsg}`);
    apiError.status = submitRes.status;
    apiError.code = "DEAPI_SUBMISSION_FAILED";
    throw apiError;
  }

  const requestId = submitJson?.data?.request_id;
  if (!requestId) {
    throw new Error("deAPI response did not contain a valid request_id.");
  }

  // 2. Poll for job completion: GET /api/v2/jobs/{request_id}
  const pollUrl = `${DEAPI_BASE_URL}/api/v2/jobs/${requestId}`;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    let statusRes;
    try {
      statusRes = await fetch(pollUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        }
      });
    } catch (pollErr) {
      // Allow transient network blips during polling
      continue;
    }

    if (!statusRes.ok) {
      continue;
    }

    const statusJson = await statusRes.json().catch(() => null);
    const data = statusJson?.data;
    if (!data) continue;

    if (data.status === "done") {
      if (!data.result_url) {
        throw new Error("deAPI completed job but did not provide result_url.");
      }
      return {
        audioUrl: data.result_url,
        duration: null,
        requestId
      };
    }

    if (data.status === "error") {
      const reason = data.error_reason || data.error_code || "Unknown worker error";
      const jobError = new Error(`deAPI audio generation failed: ${reason}`);
      jobError.code = data.error_code || "DEAPI_JOB_ERROR";
      jobError.reason = data.error_reason;
      throw jobError;
    }
  }

  const timeoutError = new Error(`deAPI audio synthesis timed out after ${timeoutMs / 1000}s`);
  timeoutError.code = "DEAPI_TIMEOUT";
  throw timeoutError;
}
