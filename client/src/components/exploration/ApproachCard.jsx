import React from "react";

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default function ApproachCard({ approach, index, getStakeholderName }) {
  const proposalLabel = `PROPOSAL ${ROMAN_NUMERALS[index] || (index + 1)}`;

  return (
    <div className="approach-card">
      <div className="approach-card-header">
        <span className="approach-tag">{proposalLabel}</span>
        <h3 className="approach-title">{approach.title}</h3>
      </div>
      <p className="approach-description">{approach.description}</p>

      {/* Addressed Concerns */}
      {approach.addresses && approach.addresses.length > 0 && (
        <div className="approach-block">
          <h4 className="approach-block-title">Addressed Concerns</h4>
          <ul className="addressed-list">
            {approach.addresses.map((addr, aIdx) => (
              <li key={aIdx} className="addressed-item">
                <span className="addressed-stakeholder">
                  {getStakeholderName(addr.stakeholderId)}:
                </span>
                <span className="addressed-concern-text">{addr.concern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trade-offs */}
      {approach.tradeoffs && approach.tradeoffs.length > 0 && (
        <div className="approach-block">
          <h4 className="approach-block-title">Potential Trade-offs</h4>
          <div className="tradeoffs-list">
            {approach.tradeoffs.map((tradeoff, tIdx) => (
              <div key={tIdx} className="tradeoff-card">
                <p className="tradeoff-description">{tradeoff.description}</p>
                <div className="tradeoff-stakeholders">
                  <span className="tradeoff-affected-label">Affected:</span>
                  <div className="tradeoff-badges">
                    {tradeoff.affectedStakeholders.map((sId, sIdx) => (
                      <span key={sIdx} className="tradeoff-stakeholder-badge">
                        {getStakeholderName(sId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Considerations */}
      {approach.implementationConsiderations && approach.implementationConsiderations.length > 0 && (
        <div className="approach-block">
          <h4 className="approach-block-title">Implementation Considerations</h4>
          <ul className="considerations-list">
            {approach.implementationConsiderations.map((item, cIdx) => (
              <li key={cIdx} className="consideration-item">
                <span className="consideration-bullet">•</span>
                <span className="consideration-text">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
