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

  // Perspective Engine & SHIFT state (Milestone 3 & 4)
  const [perspectives, setPerspectives] = useState(null);
  const [loadingPerspectives, setLoadingPerspectives] = useState(false);
  const [perspectiveError, setPerspectiveError] = useState(null);
  const [activeStakeholderId, setActiveStakeholderId] = useState(null);

  // Comparison Engine state (Milestone 5)
  const [comparison, setComparison] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);
  const [isComparisonStale, setIsComparisonStale] = useState(false);

  // Exploration Engine state (Milestone 6)
  const [exploration, setExploration] = useState(null);
  const [explorationLoading, setExplorationLoading] = useState(false);
  const [explorationError, setExplorationError] = useState(null);
  const [explorationStale, setExplorationStale] = useState(false);

  // Multimodal Perspective Audio state (Milestone 7)
  const [audioCache, setAudioCache] = useState({});
  const [audioLoadingId, setAudioLoadingId] = useState(null);
  const [audioErrorMap, setAudioErrorMap] = useState({});

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
    setAudioCache({});
    setAudioErrorMap({});
    setAudioLoadingId(null);

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
    // Reset comparison
    setComparison(null);
    setIsComparisonStale(false);
    setComparisonError(null);
    // Reset exploration
    setExploration(null);
    setExplorationStale(false);
    setExplorationError(null);
    // Reset audio (Milestone 7)
    setAudioCache({});
    setAudioErrorMap({});
    setAudioLoadingId(null);
  };

  // Allow re-editing after confirmation
  const handleReEdit = () => {
    setConfirmedStakeholders(null);
    setPerspectives(null);
    setActiveStakeholderId(null);
    setPerspectiveError(null);
    setComparison(null);
    setIsComparisonStale(false);
    setComparisonError(null);
    setExploration(null);
    setExplorationStale(false);
    setExplorationError(null);
    // Reset audio (Milestone 7)
    setAudioCache({});
    setAudioErrorMap({});
    setAudioLoadingId(null);
  };

  // Generate perspectives for the confirmed stakeholder list
  const handleGeneratePerspectives = async () => {
    if (!problemResult || !confirmedStakeholders || confirmedStakeholders.length === 0) {
      return;
    }

    setLoadingPerspectives(true);
    setPerspectiveError(null);
    // Invalidate prior audio when perspectives are regenerated
    setAudioCache({});
    setAudioErrorMap({});
    setAudioLoadingId(null);

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
      // Automatically select the first confirmed stakeholder
      if (confirmedStakeholders.length > 0) {
        setActiveStakeholderId(confirmedStakeholders[0].id);
      }

      // If comparison was already generated, mark it as stale since perspectives changed
      if (comparison) {
        setIsComparisonStale(true);
      }
      if (exploration) {
        setExplorationStale(true);
      }
    } catch (err) {
      setPerspectiveError(err.message || "An error occurred while generating perspectives.");
    } finally {
      setLoadingPerspectives(false);
    }
  };

  // Generate or retrieve cached audio narration for the active perspective (Milestone 7)
  const handleGenerateAudio = async (stakeholder, perspective) => {
    if (!problemResult || !stakeholder || !perspective) return;

    const cacheKey = `${stakeholder.id}::${JSON.stringify(perspective)}`;
    if (audioCache[cacheKey]) {
      return; // Already cached
    }

    setAudioLoadingId(stakeholder.id);
    setAudioErrorMap((prev) => ({ ...prev, [stakeholder.id]: null }));

    try {
      const response = await fetch("/api/perspective-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problemResult,
          stakeholder,
          perspective
        })
      });

      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseErr) {
        data = { error: responseText || `Server responded with HTTP ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate audio narration.");
      }

      setAudioCache((prev) => ({
        ...prev,
        [cacheKey]: data.audioUrl
      }));
    } catch (err) {
      setAudioErrorMap((prev) => ({
        ...prev,
        [stakeholder.id]: err.message || "Audio is unavailable."
      }));
    } finally {
      setAudioLoadingId(null);
    }
  };

  // Generate comparison across all confirmed stakeholder perspectives (Milestone 5)
  const handleCompare = async () => {
    if (!problemResult || !confirmedStakeholders || !perspectives) {
      return;
    }

    setLoadingComparison(true);
    setComparisonError(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problemResult,
          stakeholders: confirmedStakeholders,
          perspectives: perspectives
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate comparison.");
      }

      setComparison(data.comparison);
      setIsComparisonStale(false);

      // If exploration was already generated, mark it as stale since comparison changed
      if (exploration) {
        setExplorationStale(true);
      }
    } catch (err) {
      setComparisonError(err.message || "An error occurred while comparing perspectives.");
    } finally {
      setLoadingComparison(false);
    }
  };

  // Generate alternative exploration approaches (Milestone 6)
  const handleExplore = async () => {
    if (!problemResult || !confirmedStakeholders || !perspectives || !comparison) {
      return;
    }

    setExplorationLoading(true);
    setExplorationError(null);

    try {
      const response = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: problemResult,
          stakeholders: confirmedStakeholders,
          perspectives: perspectives,
          comparison: comparison
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate exploration approaches.");
      }

      setExploration(data.exploration);
      setExplorationStale(false);
    } catch (err) {
      setExplorationError(err.message || "An error occurred while generating exploration approaches.");
    } finally {
      setExplorationLoading(false);
    }
  };

  // Helper to resolve stakeholder name from stakeholder ID
  const getStakeholderName = (id) => {
    const s = confirmedStakeholders?.find((item) => item.id === id);
    return s ? s.name : id;
  };

  // SHIFT Interaction: Safe resolution of active stakeholder & perspective
  // If activeStakeholderId does not exist, safely fall back to the first available without crashing
  const resolvedStakeholder =
    confirmedStakeholders?.find((s) => s.id === activeStakeholderId) ||
    confirmedStakeholders?.[0] ||
    null;

  const resolvedPerspective =
    perspectives?.find((p) => p.stakeholderId === resolvedStakeholder?.id) ||
    perspectives?.[0] ||
    null;

  // SHIFT action handler (operates 100% on existing client state, 0 API calls)
  const handleShiftPerspective = (stakeholderId) => {
    setActiveStakeholderId(stakeholderId);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>PersonaShift</h1>
        <p className="subtitle">Perspective-Mapping &amp; Decision-Exploration Tool</p>
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
              placeholder="e.g. Our college is considering making attendance mandatory for all students."
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

            {/* Step 5: SHIFT Experience (Milestone 4) */}
            {perspectives && confirmedStakeholders && (
              <section className="perspectives-section" id="shift-experience">
                {/* Context Preservation: Decision Banner */}
                <div className="shift-decision-banner">
                  <div className="shift-decision-meta">
                    <span className="shift-decision-tag">DECISION UNDER CONSIDERATION</span>
                    <span className="badge domain-badge">{problemResult.domain}</span>
                  </div>
                  <h3 className="shift-decision-text">{problemResult.decision}</h3>
                </div>

                {/* Central SHIFT Control */}
                <div className="shift-container">
                  <div className="shift-header">
                    <span className="shift-tag">SHIFT</span>
                    <h2 className="shift-title">SHIFT YOUR PERSPECTIVE</h2>
                  </div>
                  <p className="shift-microcopy">
                    SHIFT between stakeholder perspectives to explore how the same decision may look different depending on who is affected.
                  </p>

                  <div
                    className="shift-tabs"
                    role="tablist"
                    aria-label="Stakeholder Perspectives Selector"
                  >
                    {confirmedStakeholders.map((s) => {
                      const isActive = s.id === resolvedStakeholder?.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          role="tab"
                          id={`shift-tab-${s.id}`}
                          aria-selected={isActive}
                          aria-controls={`shift-panel-${s.id}`}
                          tabIndex={0}
                          className={`shift-tab-btn ${isActive ? "shift-tab-active" : ""}`}
                          onClick={() => handleShiftPerspective(s.id)}
                        >
                          <span className="tab-indicator" aria-hidden="true">
                            {isActive ? "● " : "○ "}
                          </span>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Perspective Display */}
                {resolvedStakeholder && resolvedPerspective && (
                  <div
                    className="perspective-card"
                    id={`shift-panel-${resolvedStakeholder.id}`}
                    role="tabpanel"
                    aria-labelledby={`shift-tab-${resolvedStakeholder.id}`}
                  >
                    {/* Header with Neutral Framing */}
                    <div className="perspective-card-header">
                      <div>
                        <span className="perspective-eyebrow">CURRENT PERSPECTIVE</span>
                        <h3 className="perspective-title">{resolvedStakeholder.name}</h3>
                      </div>
                      <div className="badge-group">
                        <span className={`badge relevance-${resolvedStakeholder.relevance}`}>
                          {resolvedStakeholder.relevance}
                        </span>
                        <span className={`badge source-${resolvedStakeholder.source || "ai"}`}>
                          {resolvedStakeholder.source === "user" ? "user-added" : "ai"}
                        </span>
                      </div>
                    </div>

                    {/* Reused Milestone 2 Stakeholder Context */}
                    <div className="perspective-inclusion-context">
                      <span className="inclusion-label">Why this perspective is included:</span>
                      <p className="inclusion-reason">{resolvedStakeholder.reason}</p>
                    </div>

                    <div className="perspective-framing-banner">
                      <p className="framing-text">
                        Possible factors shaping this perspective
                      </p>
                    </div>

                    {/* Multimodal Perspective Audio Narration (Milestone 7) */}
                    {(() => {
                      const currentKey = `${resolvedStakeholder.id}::${JSON.stringify(resolvedPerspective)}`;
                      const cachedAudioUrl = audioCache[currentKey];
                      const isGenerating = audioLoadingId === resolvedStakeholder.id;
                      const audioError = audioErrorMap[resolvedStakeholder.id];

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
                                aria-label={`Audio narration for ${resolvedStakeholder.name} perspective`}
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
                                onClick={() => handleGenerateAudio(resolvedStakeholder, resolvedPerspective)}
                              >
                                Retry
                              </button>
                            </div>
                          ) : (
                            <div className="audio-action-wrapper">
                              <button
                                type="button"
                                className="hear-perspective-btn"
                                onClick={() => handleGenerateAudio(resolvedStakeholder, resolvedPerspective)}
                                disabled={Boolean(audioLoadingId)}
                                aria-label={`Hear audio narration for ${resolvedStakeholder.name}`}
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
                    })()}

                    {/* 5 Categories Grid */}
                    <div className="categories-grid">
                      {/* 1. Goals */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Goals</h4>
                          <span className="category-desc">Potential outcomes that may matter to this stakeholder</span>
                        </div>
                        <ul className="items-list">
                          {resolvedPerspective.goals.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span
                                className={`basis-badge basis-${item.basis}`}
                                title={`Basis: ${item.basis}`}
                              >
                                [{item.basis}]
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
                          {resolvedPerspective.concerns.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span
                                className={`basis-badge basis-${item.basis}`}
                                title={`Basis: ${item.basis}`}
                              >
                                [{item.basis}]
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 3. Constraints */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Constraints</h4>
                          <span className="category-desc">Conditions or limitations affecting this stakeholder</span>
                        </div>
                        <ul className="items-list">
                          {resolvedPerspective.constraints.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span
                                className={`basis-badge basis-${item.basis}`}
                                title={`Basis: ${item.basis}`}
                              >
                                [{item.basis}]
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Incentives */}
                      <div className="category-card">
                        <div className="category-header">
                          <h4>Incentives</h4>
                          <span className="category-desc">Factors that could shape behavior or position</span>
                        </div>
                        <ul className="items-list">
                          {resolvedPerspective.incentives.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span
                                className={`basis-badge basis-${item.basis}`}
                                title={`Basis: ${item.basis}`}
                              >
                                [{item.basis}]
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
                          {resolvedPerspective.priorities.map((item, idx) => (
                            <li key={idx} className="perspective-item">
                              <span className="item-text">{item.text}</span>
                              <span
                                className={`basis-badge basis-${item.basis}`}
                                title={`Basis: ${item.basis}`}
                              >
                                [{item.basis}]
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Accessible Basis Legend */}
                    <div className="basis-legend">
                      <span className="legend-title">Basis Indicators:</span>
                      <span className="basis-badge basis-fact">[Fact]</span>
                      <span className="legend-desc">Explicitly stated in problem data</span>
                      <span className="basis-badge basis-inference">[Inference]</span>
                      <span className="legend-desc">Reasonable contextual possibility</span>
                      <span className="basis-badge basis-unknown">[Unknown]</span>
                      <span className="legend-desc">Genuinely unknown or unconfirmed</span>
                    </div>
                  </div>
                )}

                {/* Step 6: Comparison Engine (Milestone 5) */}
                <div className="comparison-section" id="comparison-section">
                  <div className="comparison-trigger-box">
                    <div className="comparison-trigger-content">
                      <div className="comparison-header-row">
                        <span className="comparison-tag">COMPARISON</span>
                        <h2 className="comparison-title">COMPARE PERSPECTIVES</h2>
                      </div>
                      <p className="comparison-subtitle">
                        Analyze shared goals, different priorities, potential tensions, and dependencies across all confirmed stakeholder perspectives.
                      </p>

                      {isComparisonStale && (
                        <div className="stale-warning-banner">
                          <span className="stale-icon">⚠️</span>
                          <span className="stale-text">
                            Stakeholders or perspectives were updated. This comparison may be outdated.
                          </span>
                        </div>
                      )}

                      <div className="comparison-actions">
                        <button
                          type="button"
                          className="btn btn-compare"
                          onClick={handleCompare}
                          disabled={loadingComparison}
                        >
                          {loadingComparison
                            ? "Comparing perspectives..."
                            : comparison
                            ? isComparisonStale
                              ? "Regenerate Outdated Comparison"
                              : "Re-analyze Comparison"
                            : "Compare Perspectives"}
                        </button>
                      </div>

                      {comparisonError && (
                        <div className="error-box comparison-error-box">
                          <span>{comparisonError}</span>
                          <button
                            type="button"
                            className="btn-retry"
                            onClick={handleCompare}
                            disabled={loadingComparison}
                          >
                            Retry Comparison
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {comparison && (
                    <div className="comparison-results">
                      {/* 1. Shared Goals */}
                      <div className="comparison-card">
                        <div className="comparison-card-header">
                          <h3>Shared Goals</h3>
                          <span className="comparison-card-desc">
                            Goals that appear meaningfully shared across two or more stakeholder perspectives
                          </span>
                        </div>
                        {comparison.sharedGoals && comparison.sharedGoals.length > 0 ? (
                          <ul className="comparison-list">
                            {comparison.sharedGoals.map((goal, idx) => (
                              <li key={idx} className="comparison-list-item shared-goal-item">
                                <span className="goal-bullet">•</span>
                                <span className="item-text">{goal}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="empty-comparison-text">
                            No clear shared goals were identified from the available information.
                          </p>
                        )}
                      </div>

                      {/* 2. Different Priorities */}
                      <div className="comparison-card">
                        <div className="comparison-card-header">
                          <h3>Different Priorities</h3>
                          <span className="comparison-card-desc">
                            Areas where stakeholder priorities may differ or emphasize distinct aspects
                          </span>
                        </div>
                        {comparison.differentPriorities && comparison.differentPriorities.length > 0 ? (
                          <div className="priorities-grid">
                            {comparison.differentPriorities.map((dp, idx) => (
                              <div key={idx} className="priority-card">
                                <h4 className="priority-topic">{dp.topic}</h4>
                                <div className="priority-columns">
                                  <div className="priority-column">
                                    <div className="priority-party-label">
                                      {dp.stakeholderAId ? getStakeholderName(dp.stakeholderAId) : "Perspective A"}
                                    </div>
                                    <p className="priority-perspective-text">{dp.perspectiveA}</p>
                                  </div>
                                  <div className="priority-divider" aria-hidden="true">vs</div>
                                  <div className="priority-column">
                                    <div className="priority-party-label">
                                      {dp.stakeholderBId ? getStakeholderName(dp.stakeholderBId) : "Perspective B"}
                                    </div>
                                    <p className="priority-perspective-text">{dp.perspectiveB}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-comparison-text">
                            No clear different priorities were identified from the available information.
                          </p>
                        )}
                      </div>

                      {/* 3. Potential Tensions */}
                      <div className="comparison-card">
                        <div className="comparison-card-header">
                          <h3>Potential Tensions</h3>
                          <span className="comparison-card-desc">
                            Situations where two or more priorities could pull the decision in different directions
                          </span>
                        </div>
                        {comparison.tensions && comparison.tensions.length > 0 ? (
                          <div className="tensions-list">
                            {comparison.tensions.map((tension, idx) => (
                              <div key={idx} className="tension-card">
                                <div className="tension-card-header">
                                  <h4 className="tension-title">{tension.title}</h4>
                                  {tension.stakeholderIds && tension.stakeholderIds.length > 0 && (
                                    <span className="tension-stakeholders-badge">
                                      {tension.stakeholderIds.map((id) => getStakeholderName(id)).join(" ↔ ")}
                                    </span>
                                  )}
                                </div>
                                <p className="tension-explanation">{tension.explanation}</p>
                                {tension.affectedPriorities && tension.affectedPriorities.length > 0 && (
                                  <div className="tension-affected">
                                    <span className="tension-affected-label">Affected Priorities:</span>
                                    <ul className="affected-list">
                                      {tension.affectedPriorities.map((ap, apIdx) => (
                                        <li key={apIdx} className="affected-item">{ap}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-comparison-text">
                            No clear potential tensions were identified from the available information.
                          </p>
                        )}
                      </div>

                      {/* 4. Dependencies */}
                      <div className="comparison-card">
                        <div className="comparison-card-header">
                          <h3>Dependencies</h3>
                          <span className="comparison-card-desc">
                            Where one stakeholder's outcomes or concerns depend on another stakeholder or system
                          </span>
                        </div>
                        {comparison.dependencies && comparison.dependencies.length > 0 ? (
                          <div className="dependencies-list">
                            {comparison.dependencies.map((dep, idx) => (
                              <div key={idx} className="dependency-card">
                                <p className="dependency-desc">{dep.description}</p>
                                <div className="dependency-stakeholders">
                                  <span className="dependency-label">Involved Stakeholders:</span>
                                  <div className="dependency-badges">
                                    {dep.stakeholders.map((sId, sIdx) => (
                                      <span key={sIdx} className="dependency-stakeholder-badge">
                                        {getStakeholderName(sId)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="empty-comparison-text">
                            No clear dependencies were identified from the available information.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 7: Exploration Engine (Milestone 6) */}
                {comparison && (
                  <div className="exploration-section" id="exploration-section">
                    <div className="exploration-trigger-box">
                      <div className="exploration-trigger-content">
                        <div className="exploration-header-row">
                          <span className="exploration-tag">EXPLORATION</span>
                          <h2 className="exploration-title">EXPLORE ALTERNATIVE APPROACHES</h2>
                        </div>
                        <p className="exploration-subtitle">
                          These are alternative approaches generated from the perspectives, priorities, tensions, and dependencies above. They are not ranked or recommended.
                        </p>

                        {explorationStale && (
                          <div className="stale-warning-banner">
                            <span className="stale-icon">⚠️</span>
                            <span className="stale-text">
                              This exploration is based on an earlier analysis. Regenerate approaches to reflect recent changes.
                            </span>
                          </div>
                        )}

                        <div className="exploration-actions">
                          <button
                            type="button"
                            className="btn btn-explore"
                            onClick={handleExplore}
                            disabled={explorationLoading}
                          >
                            {explorationLoading
                              ? "Exploring approaches..."
                              : exploration
                              ? explorationStale
                                ? "Regenerate Outdated Approaches"
                                : "Re-explore Approaches"
                              : "Explore Approaches"}
                          </button>
                        </div>

                        {explorationError && (
                          <div className="error-box exploration-error-box">
                            <span>{explorationError}</span>
                            <button
                              type="button"
                              className="btn-retry"
                              onClick={handleExplore}
                              disabled={explorationLoading}
                            >
                              Retry Exploration
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {exploration && (
                      <div className="exploration-results">
                        <div className="approaches-list">
                          {exploration.approaches.map((approach, idx) => (
                            <div key={approach.id || idx} className="approach-card">
                              <div className="approach-card-header">
                                <span className="approach-tag">Approach {idx + 1}</span>
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
                          ))}
                        </div>
                      </div>
                    )}
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
