import React, { useState } from "react";

export default function App() {
  // Problem Parser state
  const [problemInput, setProblemInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [problemError, setProblemError] = useState(null);
  const [problemResult, setProblemResult] = useState(null);

  // Stakeholder Engine state
  const [stakeholders, setStakeholders] = useState([]);
  const [loadingStakeholders, setLoadingStakeholders] = useState(false);
  const [stakeholderError, setStakeholderError] = useState(null);
  const [confirmedStakeholders, setConfirmedStakeholders] = useState(null);

  // Perspective Engine state (Milestone 3)
  const [perspectives, setPerspectives] = useState(null);
  const [loadingPerspectives, setLoadingPerspectives] = useState(false);
  const [perspectiveError, setPerspectiveError] = useState(null);
  const [activeStakeholderId, setActiveStakeholderId] = useState(null);

  // Editing state for an individual stakeholder
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", reason: "", relevance: "direct" });

  // Add new stakeholder form state
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    reason: "",
    relevance: "direct"
  });
  const [addError, setAddError] = useState(null);

  // Submit problem description to /api/analyze
  const handleAnalyze = async (e) => {
    e.preventDefault();

    const trimmed = problemInput.trim();
    if (!trimmed) {
      setProblemError("Please provide a problem description.");
      return;
    }

    setAnalyzing(true);
    setProblemError(null);
    setProblemResult(null);
    setStakeholders([]);
    setConfirmedStakeholders(null);
    setPerspectives(null);
    setActiveStakeholderId(null);
    setStakeholderError(null);
    setPerspectiveError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: trimmed })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze problem.");
      }

      setProblemResult(data.problem);

      // Automatically fetch suggested stakeholders for the parsed problem
      fetchStakeholders(data.problem);
    } catch (err) {
      setProblemError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Fetch AI-suggested stakeholders from /api/stakeholders
  const fetchStakeholders = async (problem) => {
    setLoadingStakeholders(true);
    setStakeholderError(null);

    try {
      const response = await fetch("/api/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to discover stakeholders.");
      }

      // Add a 'kept' property to track user selection (defaults to true)
      const mapped = (data.stakeholders || []).map((s) => ({
        ...s,
        kept: true
      }));

      setStakeholders(mapped);
    } catch (err) {
      setStakeholderError(err.message || "Could not discover stakeholders.");
    } finally {
      setLoadingStakeholders(false);
    }
  };

  // Toggle "Keep" state
  const toggleKeep = (id) => {
    setStakeholders((prev) =>
      prev.map((s) => (s.id === id ? { ...s, kept: !s.kept } : s))
    );
  };

  // Remove a stakeholder
  const handleRemove = (id) => {
    setStakeholders((prev) => prev.filter((s) => s.id !== id));
  };

  // Start editing a stakeholder
  const startEditing = (s) => {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      reason: s.reason,
      relevance: s.relevance
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ name: "", reason: "", relevance: "direct" });
  };

  // Save edited stakeholder
  const saveEdit = (id) => {
    if (!editForm.name.trim() || !editForm.reason.trim()) {
      return;
    }

    setStakeholders((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              name: editForm.name.trim(),
              reason: editForm.reason.trim(),
              relevance: editForm.relevance
            }
          : s
      )
    );

    setEditingId(null);
  };

  // Add a user-created stakeholder
  const handleAddStakeholder = (e) => {
    e.preventDefault();
    setAddError(null);

    const name = newStakeholder.name.trim();
    const reason = newStakeholder.reason.trim();

    if (!name || !reason) {
      setAddError("Please provide both a name and a reason.");
      return;
    }

    // Check for duplicate names (normalized)
    const normalizedNew = name.toLowerCase();
    const exists = stakeholders.some((s) => s.name.trim().toLowerCase() === normalizedNew);
    if (exists) {
      setAddError("A stakeholder with this name already exists.");
      return;
    }

    const created = {
      id: `user-${Date.now()}`,
      name,
      reason,
      relevance: newStakeholder.relevance,
      source: "user",
      kept: true
    };

    setStakeholders((prev) => [...prev, created]);
    setNewStakeholder({ name: "", reason: "", relevance: "direct" });
  };

  // Confirm final stakeholder list
  const handleConfirm = () => {
    const finalized = stakeholders.filter((s) => s.kept);
    setConfirmedStakeholders(finalized);
    // Reset any previously generated perspectives when confirming an updated list
    setPerspectives(null);
    setActiveStakeholderId(null);
    setPerspectiveError(null);
  };

  // Allow re-editing after confirmation
  const handleReEdit = () => {
    setConfirmedStakeholders(null);
    setPerspectives(null);
    setActiveStakeholderId(null);
    setPerspectiveError(null);
  };

  // Generate perspectives for the confirmed stakeholder list (Milestone 3)
  const handleGeneratePerspectives = async () => {
    if (!problemResult || !confirmedStakeholders || confirmedStakeholders.length === 0) {
      return;
    }

    setLoadingPerspectives(true);
    setPerspectiveError(null);

    try {
      const response = await fetch("/api/perspectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problemResult,
          stakeholders: confirmedStakeholders
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate perspectives.");
      }

      setPerspectives(data.perspectives);
      if (confirmedStakeholders.length > 0) {
        setActiveStakeholderId(confirmedStakeholders[0].id);
      }
    } catch (err) {
      setPerspectiveError(err.message || "An error occurred while generating perspectives.");
    } finally {
      setLoadingPerspectives(false);
    }
  };

  // Retrieve current active perspective
  const currentStakeholder = confirmedStakeholders?.find(
    (s) => s.id === activeStakeholderId
  );
  const currentPerspective = perspectives?.find(
    (p) => p.stakeholderId === activeStakeholderId
  );

  return (
    <div className="container">
      <header className="header">
        <h1>PersonaShift</h1>
        <p className="subtitle">Milestone 3: Problem Parser + Stakeholder Engine + Perspective Engine</p>
      </header>

      <main>
        {/* Step 1: Problem Input */}
        <section className="input-section">
          <form onSubmit={handleAnalyze}>
            <label htmlFor="problem-input" className="input-label">
              Describe a problem or decision
            </label>
            <textarea
              id="problem-input"
              rows={4}
              value={problemInput}
              onChange={(e) => setProblemInput(e.target.value)}
              placeholder="e.g. Our college is considering replacing physical textbooks with tablets."
              disabled={analyzing}
            />

            <div className="button-row">
              <button type="submit" disabled={analyzing || !problemInput.trim()}>
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
            <div className="loading-box">
              <p>Parsing problem into structured model...</p>
            </div>
          )}
        </section>

        {/* Step 2: Problem Result */}
        {problemResult && (
          <section className="result-section">
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

            {/* Step 3: Stakeholders Section */}
            <div className="stakeholders-wrapper">
              <div className="section-header">
                <h2>Stakeholders</h2>
                {!loadingStakeholders && stakeholders.length === 0 && !stakeholderError && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => fetchStakeholders(problemResult)}
                  >
                    Discover Stakeholders
                  </button>
                )}
              </div>

              {loadingStakeholders && (
                <div className="loading-box">
                  <p>Discovering affected stakeholders using Gemini...</p>
                </div>
              )}

              {stakeholderError && (
                <div className="error-box">
                  <strong>Error: </strong> {stakeholderError}
                  <div style={{ marginTop: "8px" }}>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => fetchStakeholders(problemResult)}
                    >
                      Retry Discovery
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmed Stakeholder List View */}
              {confirmedStakeholders ? (
                <div className="confirmed-section">
                  <div className="confirmed-header">
                    <h3>Confirmed Stakeholder List ({confirmedStakeholders.length})</h3>
                    <button type="button" className="secondary-btn" onClick={handleReEdit}>
                      Edit Stakeholders
                    </button>
                  </div>

                  {confirmedStakeholders.length === 0 ? (
                    <p className="empty-text">No stakeholders were selected.</p>
                  ) : (
                    <div className="stakeholder-list">
                      {confirmedStakeholders.map((s) => (
                        <div key={s.id} className="stakeholder-card confirmed-card">
                          <div className="stakeholder-header">
                            <h4 className="stakeholder-name">{s.name}</h4>
                            <div className="badge-group">
                              <span className={`badge relevance-${s.relevance}`}>
                                {s.relevance}
                              </span>
                              <span className={`badge source-${s.source || "ai"}`}>
                                {s.source === "user" ? "user-added" : "ai"}
                              </span>
                            </div>
                          </div>
                          <p className="stakeholder-reason">{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Step 4: Perspective Generation Trigger */}
                  {!perspectives && (
                    <div className="generate-perspectives-box">
                      <p className="generate-text">
                        Generate structured, uncertainty-aware perspectives for each of your confirmed stakeholders.
                      </p>
                      <button
                        type="button"
                        className="confirm-btn"
                        onClick={handleGeneratePerspectives}
                        disabled={loadingPerspectives || confirmedStakeholders.length === 0}
                      >
                        {loadingPerspectives
                          ? "Generating Perspectives..."
                          : `Generate Perspectives (${confirmedStakeholders.length})`}
                      </button>
                    </div>
                  )}

                  {loadingPerspectives && (
                    <div className="loading-box">
                      <p>Constructing neutral perspective models using Gemini...</p>
                    </div>
                  )}

                  {perspectiveError && (
                    <div className="error-box">
                      <strong>Error: </strong> {perspectiveError}
                      <div style={{ marginTop: "8px" }}>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={handleGeneratePerspectives}
                        >
                          Retry Perspective Generation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Stakeholder Review & Edit Mode */
                !loadingStakeholders &&
                stakeholders.length > 0 && (
                  <div className="stakeholder-review">
                    <p className="review-intro">
                      Review, edit, add, or remove stakeholders. You have final authority over this list.
                    </p>

                    <div className="stakeholder-list">
                      {stakeholders.map((s) => (
                        <div
                          key={s.id}
                          className={`stakeholder-card ${s.kept ? "card-kept" : "card-excluded"}`}
                        >
                          {editingId === s.id ? (
                            /* Inline Edit Form */
                            <div className="edit-form">
                              <div className="form-group">
                                <label>Stakeholder Name</label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, name: e.target.value })
                                  }
                                />
                              </div>
                              <div className="form-group">
                                <label>Relevance</label>
                                <select
                                  value={editForm.relevance}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, relevance: e.target.value })
                                  }
                                >
                                  <option value="direct">Direct</option>
                                  <option value="indirect">Indirect</option>
                                  <option value="system">System</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Reason</label>
                                <textarea
                                  rows={3}
                                  value={editForm.reason}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, reason: e.target.value })
                                  }
                                />
                              </div>
                              <div className="action-row">
                                <button
                                  type="button"
                                  className="save-btn"
                                  onClick={() => saveEdit(s.id)}
                                  disabled={!editForm.name.trim() || !editForm.reason.trim()}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="cancel-btn"
                                  onClick={cancelEditing}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal View Mode */
                            <>
                              <div className="stakeholder-header">
                                <h4 className="stakeholder-name">{s.name}</h4>
                                <div className="badge-group">
                                  <span className={`badge relevance-${s.relevance}`}>
                                    {s.relevance}
                                  </span>
                                  <span className={`badge source-${s.source || "ai"}`}>
                                    {s.source === "user" ? "user-added" : "ai"}
                                  </span>
                                </div>
                              </div>

                              <p className="stakeholder-reason">{s.reason}</p>

                              <div className="card-actions">
                                <button
                                  type="button"
                                  className={`action-btn ${s.kept ? "btn-keep-active" : "btn-keep"}`}
                                  onClick={() => toggleKeep(s.id)}
                                >
                                  {s.kept ? "✓ Kept" : "Keep"}
                                </button>
                                <button
                                  type="button"
                                  className="action-btn btn-edit"
                                  onClick={() => startEditing(s)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="action-btn btn-remove"
                                  onClick={() => handleRemove(s.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Stakeholder Form */}
                    <div className="add-stakeholder-box">
                      <h3>Add Stakeholder</h3>
                      <form onSubmit={handleAddStakeholder}>
                        <div className="add-grid">
                          <div className="form-group">
                            <label htmlFor="new-name">Stakeholder Name</label>
                            <input
                              id="new-name"
                              type="text"
                              placeholder="e.g. Local Bookstores"
                              value={newStakeholder.name}
                              onChange={(e) =>
                                setNewStakeholder({ ...newStakeholder, name: e.target.value })
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label htmlFor="new-relevance">Relevance</label>
                            <select
                              id="new-relevance"
                              value={newStakeholder.relevance}
                              onChange={(e) =>
                                setNewStakeholder({ ...newStakeholder, relevance: e.target.value })
                              }
                            >
                              <option value="direct">Direct</option>
                              <option value="indirect">Indirect</option>
                              <option value="system">System</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="new-reason">Reason</label>
                          <textarea
                            id="new-reason"
                            rows={2}
                            placeholder="Why this stakeholder could be affected..."
                            value={newStakeholder.reason}
                            onChange={(e) =>
                              setNewStakeholder({ ...newStakeholder, reason: e.target.value })
                            }
                          />
                        </div>

                        {addError && <p className="add-error-text">{addError}</p>}

                        <div className="button-row">
                          <button
                            type="submit"
                            className="secondary-btn"
                            disabled={!newStakeholder.name.trim() || !newStakeholder.reason.trim()}
                          >
                            + Add Stakeholder
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Confirm Button */}
                    <div className="confirm-row">
                      <button
                        type="button"
                        className="confirm-btn"
                        onClick={handleConfirm}
                        disabled={stakeholders.filter((s) => s.kept).length === 0}
                      >
                        Confirm Stakeholder List ({stakeholders.filter((s) => s.kept).length})
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Step 5: Perspective Engine & SHIFT View (Milestone 3) */}
            {perspectives && confirmedStakeholders && (
              <section className="perspectives-section">
                <div className="perspectives-header">
                  <h2>Perspectives</h2>
                  <p className="perspectives-subtitle">
                    Structured factor mapping for each confirmed stakeholder. Shifting between perspectives reveals different possible priorities and constraints.
                  </p>
                </div>

                {/* SHIFT Selector Tabs */}
                <div className="shift-container">
                  <div className="shift-header">
                    <span className="shift-tag">SHIFT</span>
                    <span className="shift-label">Select Stakeholder Perspective:</span>
                  </div>

                  <div className="shift-tabs" role="tablist">
                    {confirmedStakeholders.map((s) => {
                      const isActive = s.id === activeStakeholderId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          className={`shift-tab-btn ${isActive ? "shift-tab-active" : ""}`}
                          onClick={() => setActiveStakeholderId(s.id)}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Active Perspective Card */}
                {currentStakeholder && currentPerspective && (
                  <div className="perspective-card">
                    <div className="perspective-card-header">
                      <div>
                        <span className="perspective-eyebrow">Current Perspective</span>
                        <h3 className="perspective-title">{currentStakeholder.name}</h3>
                      </div>
                      <div className="badge-group">
                        <span className={`badge relevance-${currentStakeholder.relevance}`}>
                          {currentStakeholder.relevance}
                        </span>
                        <span className={`badge source-${currentStakeholder.source || "ai"}`}>
                          {currentStakeholder.source === "user" ? "user-added" : "ai"}
                        </span>
                      </div>
                    </div>

                    <p className="perspective-stakeholder-reason">
                      <strong>Context: </strong>{currentStakeholder.reason}
                    </p>

                    <div className="categories-grid">
                      {/* 1. Goals */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Goals</h4>
                          <span className="category-desc">Potential outcomes that may matter</span>
                        </div>
                        <ul className="items-list">
                          {currentPerspective.goals.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span className={`basis-badge basis-${item.basis}`}>
                                {item.basis}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 2. Concerns */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Concerns</h4>
                          <span className="category-desc">Potential risks, downsides, or negative outcomes</span>
                        </div>
                        <ul className="items-list">
                          {currentPerspective.concerns.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span className={`basis-badge basis-${item.basis}`}>
                                {item.basis}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Constraints */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Constraints</h4>
                          <span className="category-desc">Limitations or conditions affecting action</span>
                        </div>
                        <ul className="items-list">
                          {currentPerspective.constraints.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span className={`basis-badge basis-${item.basis}`}>
                                {item.basis}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Incentives */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Incentives</h4>
                          <span className="category-desc">Factors shaping behavior or positions</span>
                        </div>
                        <ul className="items-list">
                          {currentPerspective.incentives.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span className={`basis-badge basis-${item.basis}`}>
                                {item.basis}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 5. Priorities */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Priorities</h4>
                          <span className="category-desc">Factors prioritized when evaluating the decision</span>
                        </div>
                        <ul className="items-list">
                          {currentPerspective.priorities.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span className={`basis-badge basis-${item.basis}`}>
                                {item.basis}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="basis-legend">
                      <span className="legend-title">Basis Indicators:</span>
                      <span className="basis-badge basis-fact">Fact</span>
                      <span className="legend-desc">Explicitly stated in problem data</span>
                      <span className="basis-badge basis-inference">Inference</span>
                      <span className="legend-desc">Reasonable contextual possibility</span>
                      <span className="basis-badge basis-unknown">Unknown</span>
                      <span className="legend-desc">Genuinely unknown or unconfirmed</span>
                    </div>
                  </div>
                )}
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
