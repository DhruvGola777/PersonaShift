import React, { useState } from "react";

export default function App() {
  const [problemInput, setProblemInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = problemInput.trim();
    if (!trimmed) {
      setError("Please provide a problem description.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ problem: trimmed })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze problem.");
      }

      setResult(data.problem);
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>PersonaShift</h1>
        <p className="subtitle">Perspective-mapping &amp; decision-exploration foundation</p>
      </header>

      <main>
        <section className="input-section">
          <form onSubmit={handleSubmit}>
            <label htmlFor="problem-input" className="input-label">
              Describe a problem or decision
            </label>
            <textarea
              id="problem-input"
              rows={5}
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              placeholder="e.g. Our college is considering replacing physical textbooks with tablets."
              disabled={loading}
            />

            <div className="button-row">
              <button type="submit" disabled={loading || !problemInput.trim()}>
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </form>

          {error && (
            <div className="error-box" role="alert">
              <strong>Error: </strong> {error}
            </div>
          )}

          {loading && (
            <div className="loading-box">
              <p>Parsing problem into structured model...</p>
            </div>
          )}
        </section>

        {result && (
          <section className="result-section">
            <h2>Problem Summary</h2>
            <div className="result-card">
              <p className="summary-text">{result.summary}</p>

              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Decision</span>
                  <span className="meta-value">{result.decision}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Domain</span>
                  <span className="meta-value badge">{result.domain}</span>
                </div>
              </div>
            </div>

            <div className="lists-grid">
              <div className="list-card">
                <h3>Facts</h3>
                {result.facts && result.facts.length > 0 ? (
                  <ul>
                    {result.facts.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">None explicitly stated.</p>
                )}
              </div>

              <div className="list-card">
                <h3>Unknowns</h3>
                {result.unknowns && result.unknowns.length > 0 ? (
                  <ul>
                    {result.unknowns.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">None identified.</p>
                )}
              </div>

              <div className="list-card">
                <h3>Assumptions</h3>
                {result.assumptions && result.assumptions.length > 0 ? (
                  <ul>
                    {result.assumptions.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">None identified.</p>
                )}
              </div>

              <div className="list-card">
                <h3>Affected Areas</h3>
                {result.affectedAreas && result.affectedAreas.length > 0 ? (
                  <ul>
                    {result.affectedAreas.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">None identified.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
