import React from "react";

export default function PerspectiveAudio({
  stakeholder,
  perspective,
  audioCache,
  audioLoadingId,
  audioErrorMap,
  onGenerateAudio
}) {
  if (!stakeholder || !perspective) return null;

  const currentKey = `${stakeholder.id}::${JSON.stringify(perspective)}`;
  const cachedAudioUrl = audioCache[currentKey];
  const isGenerating = audioLoadingId === stakeholder.id;
  const audioError = audioErrorMap[stakeholder.id];

  return (
    <div className="perspective-audio-box" aria-label="Perspective Audio Control">
      {isGenerating ? (
        <div className="audio-status-box audio-loading-box" role="status" aria-live="polite">
          <span className="audio-spinner" aria-hidden="true" />
          <span className="audio-loading-text">Hearing the perspective...</span>
        </div>
      ) : cachedAudioUrl ? (
        <div className="audio-player-wrapper">
          <div className="audio-player-meta">
            <span className="audio-badge">AI-generated narration</span>
            <span className="audio-disclaimer">Neutral audio reading of structured perspective factors</span>
          </div>
          <audio
            controls
            src={cachedAudioUrl}
            className="perspective-audio-player"
            aria-label={`Audio narration for ${stakeholder.name} perspective`}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : audioError ? (
        <div className="audio-status-box audio-error-box" role="alert">
          <span className="audio-error-text">{audioError}</span>
          <button
            type="button"
            className="audio-retry-btn"
            onClick={() => onGenerateAudio(stakeholder, perspective)}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="audio-action-wrapper">
          <p className="audio-helper-text">
            Generate a short neutral narration of this perspective.
          </p>
          <button
            type="button"
            className="hear-perspective-btn"
            onClick={() => onGenerateAudio(stakeholder, perspective)}
            disabled={Boolean(audioLoadingId)}
            aria-label={`Hear audio narration for ${stakeholder.name}`}
          >
            <svg
              className="audio-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <span>Hear this perspective</span>
          </button>
        </div>
      )}
    </div>
  );
}
