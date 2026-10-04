import React from "react";

export default function AddStakeholderForm({
  newStakeholder,
  setNewStakeholder,
  addError,
  onAddStakeholder
}) {
  return (
    <div className="add-stakeholder-box">
      <h3>Add Stakeholder</h3>
      <form onSubmit={onAddStakeholder}>
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

        {addError && <p className="add-error-text" role="alert">{addError}</p>}

        <div className="button-row">
          <button
            type="submit"
            className="secondary-btn"
            disabled={!newStakeholder.name.trim() || !newStakeholder.reason.trim()}
            aria-label="Add new custom stakeholder"
          >
            + Add Stakeholder
          </button>
        </div>
      </form>
    </div>
  );
}
