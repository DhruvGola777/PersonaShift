import React, { useState } from "react";
import Header from "./components/common/Header.jsx";
import ProblemInput from "./components/problem/ProblemInput.jsx";
import ProblemSummary from "./components/problem/ProblemSummary.jsx";
import StakeholdersSection from "./components/stakeholders/StakeholdersSection.jsx";
import ShiftExperience from "./components/perspectives/ShiftExperience.jsx";
import ComparisonSection from "./components/comparison/ComparisonSection.jsx";
import ExplorationSection from "./components/exploration/ExplorationSection.jsx";

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
      <Header />

      <main>
        {/* Step 1: Problem Input */}
        <ProblemInput
          problemInput={problemInput}
          setProblemInput={setProblemInput}
          analyzing={analyzing}
          problemError={problemError}
          onSubmit={handleAnalyze}
        />

        {/* Step 2: Problem Result */}
        {problemResult && (
          <section className="result-section">
            <ProblemSummary problemResult={problemResult} />

            {/* Step 3: Stakeholders Section */}
            <StakeholdersSection
              problemResult={problemResult}
              stakeholders={stakeholders}
              loadingStakeholders={loadingStakeholders}
              stakeholderError={stakeholderError}
              confirmedStakeholders={confirmedStakeholders}
              onFetchStakeholders={fetchStakeholders}
              onReEdit={handleReEdit}
              perspectives={perspectives}
              loadingPerspectives={loadingPerspectives}
              perspectiveError={perspectiveError}
              onGeneratePerspectives={handleGeneratePerspectives}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              onSaveEdit={saveEdit}
              onCancelEditing={cancelEditing}
              onToggleKeep={toggleKeep}
              onStartEditing={startEditing}
              onRemove={handleRemove}
              newStakeholder={newStakeholder}
              setNewStakeholder={setNewStakeholder}
              addError={addError}
              onAddStakeholder={handleAddStakeholder}
              onConfirm={handleConfirm}
            />

            {/* Step 4 & 5: SHIFT Experience & Perspective Audio */}
            {perspectives && confirmedStakeholders && (
              <section className="perspectives-section" id="shift-experience">
                <ShiftExperience
                  problemResult={problemResult}
                  confirmedStakeholders={confirmedStakeholders}
                  resolvedStakeholder={resolvedStakeholder}
                  resolvedPerspective={resolvedPerspective}
                  onShiftPerspective={handleShiftPerspective}
                  audioCache={audioCache}
                  audioLoadingId={audioLoadingId}
                  audioErrorMap={audioErrorMap}
                  onGenerateAudio={handleGenerateAudio}
                />

                {/* Step 6: Comparison Engine */}
                <ComparisonSection
                  comparison={comparison}
                  loadingComparison={loadingComparison}
                  comparisonError={comparisonError}
                  isComparisonStale={isComparisonStale}
                  onCompare={handleCompare}
                  getStakeholderName={getStakeholderName}
                />

                {/* Step 7: Exploration Engine */}
                {comparison && (
                  <ExplorationSection
                    exploration={exploration}
                    explorationLoading={explorationLoading}
                    explorationError={explorationError}
                    explorationStale={explorationStale}
                    onExplore={handleExplore}
                    getStakeholderName={getStakeholderName}
                  />
                )}
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
