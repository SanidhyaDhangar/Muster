import { useEffect, useState } from "react";

import { api } from "../api/client";
import Modal from "../components/Modal";

const EMPTY = {
  period_name: "",
  start_time: "",
  end_time: "",
  prof_id: "",
  branch: "",
  semester: "",
  description: "",
};

export default function Schedule() {
  const [periods, setPeriods] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");

  async function load() {
    const [scheduleData, professorData] = await Promise.all([
      api.get("/api/schedule"),
      api.get("/api/professors"),
    ]);
    setPeriods(scheduleData);
    setProfessors(professorData);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function openCreate() {
    setFormError("");
    setEditing({ ...EMPTY, isNew: true });
  }

  function openEdit(period) {
    setFormError("");
    setEditing({ ...EMPTY, ...period, prof_id: period.prof_id || "", isNew: false });
  }

  async function save(event) {
    event.preventDefault();
    setFormError("");
    const payload = {
      period_name: editing.period_name,
      start_time: editing.start_time,
      end_time: editing.end_time,
      prof_id: editing.prof_id || null,
      branch: editing.branch || null,
      semester: editing.semester ? Number(editing.semester) : null,
      description: editing.description || null,
    };
    try {
      if (editing.isNew) {
        await api.post("/api/schedule", payload);
      } else {
        await api.put(`/api/schedule/${editing.period_id}`, payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function remove(periodId) {
    if (!window.confirm("Delete this period?")) return;
    await api.delete(`/api/schedule/${periodId}`);
    load();
  }

  function field(key, value) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Schedule</h1>
        <button onClick={openCreate}>Add period</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Time</th>
            <th>Professor</th>
            <th>Branch</th>
            <th>Semester</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period.period_id}>
              <td>{period.period_name}</td>
              <td>
                {period.start_time} – {period.end_time}
              </td>
              <td>{period.prof_name || "—"}</td>
              <td>{period.branch || "—"}</td>
              <td>{period.semester ?? "—"}</td>
              <td>
                <div className="row-actions">
                  <button className="ghost" onClick={() => openEdit(period)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => remove(period.period_id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {periods.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No periods yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.isNew ? "Add period" : "Edit period"} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label>Period name</label>
                <input
                  value={editing.period_name}
                  onChange={(event) => field("period_name", event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Professor</label>
                <select value={editing.prof_id} onChange={(event) => field("prof_id", event.target.value)}>
                  <option value="">—</option>
                  {professors.map((professor) => (
                    <option key={professor.prof_id} value={professor.prof_id}>
                      {professor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Start time</label>
                <input
                  type="time"
                  value={editing.start_time}
                  onChange={(event) => field("start_time", event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>End time</label>
                <input
                  type="time"
                  value={editing.end_time}
                  onChange={(event) => field("end_time", event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Branch</label>
                <input value={editing.branch} onChange={(event) => field("branch", event.target.value)} />
              </div>
              <div className="field">
                <label>Semester</label>
                <input
                  type="number"
                  value={editing.semester}
                  onChange={(event) => field("semester", event.target.value)}
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: "1rem" }}>
              <label>Description</label>
              <textarea
                rows={2}
                value={editing.description || ""}
                onChange={(event) => field("description", event.target.value)}
              />
            </div>
            {formError && <div className="error" style={{ marginTop: "0.75rem" }}>{formError}</div>}
            <div className="form-actions">
              <button type="button" className="ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
