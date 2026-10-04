import React from "react";

const EXAMPLE_PRESETS = [
  {
    label: "Return-to-office policy",
    text: "Our company is considering mandating a 3-day return-to-office policy for all employees."
  },
  {
    label: "Pedestrian-only street",
    text: "The city is considering converting a major road into a pedestrian-only zone."
  },
  {
    label: "Mandatory college attendance",
    text: "Our college is considering making attendance mandatory for all students."
  }
];

export default function ProblemInput({
  problemInput,
  setProblemInput,
  analyzing,
  problemError,
  onSubmit,
  hasResult = false
}) {
  const handleSelectPreset = (text) => {
    if (!analyzing) {
      setProblemInput(text);
    }
  };

  return (
    <section className="input-section">
      <form onSubmit={onSubmit} className="problem-form">
        <div className="input-header-row">
          <div className="input-title-lockup">
            <label htmlFor="problem-input" className="input-label">
              Decision Dilemma
            </label>
            <span className="input-sublabel">
              Formulate a policy change, strategic initiative, or organizational choice.
            </span>
          </div>
          <span className="workspace-badge">DECISION WORKSPACE</span>
        </div>

        <div className="textarea-container">
          <textarea
            id="problem-input"
            rows={4}
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            placeholder="e.g. Our college is considering making attendance mandatory for all students."
            disabled={analyzing}
            aria-label="Decision problem description"
          />
        </div>

        <div className="input-footer-bar">
          <div className="input-hint">
            <span className="hint-bullet">•</span>
            <span>State proposed actions, constraints, or the operational context under review.</span>
          </div>

          <div className="input-actions">
            {problemInput.trim() && !analyzing && (
              <button
                type="button"
                className="secondary-btn btn-clear"
                onClick={() => setProblemInput("")}
                aria-label="Clear input text"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              className="primary-btn btn-analyze"
              disabled={analyzing || !problemInput.trim()}
              aria-label="Analyze problem input"
            >
              {analyzing ? (
                <>
                  <span className="spinner-inline" aria-hidden="true" />
                  <span>Analyzing Decision...</span>
                </>
              ) : (
                "Analyze Decision"
              )}
            </button>
          </div>
        </div>

        {/* Compact Example Chips below input */}
        {!hasResult && (
          <div className="example-chips-section">
            <span className="example-chips-label">Try an example:</span>
            <div className="example-chips-group" role="group" aria-label="Example decision dilemmas">
              {EXAMPLE_PRESETS.map((preset) => {
                const isSelected = problemInput.trim() === preset.text;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`example-chip ${isSelected ? "is-selected" : ""}`}
                    onClick={() => handleSelectPreset(preset.text)}
                    disabled={analyzing}
                    aria-pressed={isSelected}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </form>

      {problemError && (
        <div className="error-box" role="alert">
          <strong>Error: </strong> {problemError}
        </div>
      )}

      {analyzing && (
        <div className="loading-box" role="status" aria-live="polite">
          <p>Parsing problem into structured model...</p>
        </div>
      )}
    </section>
  );
}


