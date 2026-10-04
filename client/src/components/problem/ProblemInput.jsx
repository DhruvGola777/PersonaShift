import React from "react";

export default function ProblemInput({
  problemInput,
  setProblemInput,
  analyzing,
  problemError,
  onSubmit
}) {
  return (
    <section className="input-section">
      <form onSubmit={onSubmit}>
        <label htmlFor="problem-input" className="input-label">
          Describe a problem or decision
        </label>
        <textarea
          id="problem-input"
          rows={4}
          value={problemInput}
          onChange={(e) => setProblemInput(e.target.value)}
          placeholder="e.g. Our college is considering making attendance mandatory for all students."
          disabled={analyzing}
        />

        <div className="button-row">
          <button
            type="submit"
            disabled={analyzing || !problemInput.trim()}
            aria-label="Analyze problem input"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
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
