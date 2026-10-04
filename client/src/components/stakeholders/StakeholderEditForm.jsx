import React from "react";

export default function StakeholderEditForm({
  stakeholder,
  editForm,
  setEditForm,
  onSave,
  onCancel
}) {
  return (
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
          onClick={() => onSave(stakeholder.id)}
          disabled={!editForm.name.trim() || !editForm.reason.trim()}
        >
          Save
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
