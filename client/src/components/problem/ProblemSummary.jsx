import React from "react";

export default function ProblemSummary({ problemResult }) {
  if (!problemResult) return null;

  return (
    <>
      <h2>Problem Summary</h2>
      <div className="result-card">
        <p className="summary-text">{problemResult.summary}</p>

        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">Decision</span>
            <span className="meta-value">{problemResult.decision}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Domain</span>
            <span className="meta-value badge domain-badge">{problemResult.domain}</span>
          </div>
        </div>
      </div>

      <div className="lists-grid">
        <div className="list-card">
          <h3>Facts</h3>
          {problemResult.facts && problemResult.facts.length > 0 ? (
            <ul>
              {problemResult.facts.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">None explicitly stated.</p>
          )}
        </div>

        <div className="list-card">
          <h3>Unknowns</h3>
          {problemResult.unknowns && problemResult.unknowns.length > 0 ? (
            <ul>
              {problemResult.unknowns.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">None identified.</p>
          )}
        </div>

        <div className="list-card">
          <h3>Assumptions</h3>
          {problemResult.assumptions && problemResult.assumptions.length > 0 ? (
            <ul>
              {problemResult.assumptions.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">None identified.</p>
          )}
        </div>

        <div className="list-card">
          <h3>Affected Areas</h3>
          {problemResult.affectedAreas && problemResult.affectedAreas.length > 0 ? (
            <ul>
              {problemResult.affectedAreas.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">None identified.</p>
          )}
        </div>
      </div>
    </>
  );
}
