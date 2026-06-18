import { useEffect, useState } from "react";

import { api } from "../api/client";
import Modal from "../components/Modal";
import { fileToDataUrl } from "../utils";

const EMPTY = {
  prof_id: "",
  name: "",
  department: "",
  email: "",
  mobile: "",
  qualification: "",
  experience: "",
  achievements: "",
  others: "",
  photo: null,
};

export default function Professors() {
  const [professors, setProfessors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");

  async function load() {
    setProfessors(await api.get("/api/professors"));
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function openCreate() {
    setFormError("");
    setEditing({ ...EMPTY, isNew: true });
  }

  function openEdit(professor) {
    setFormError("");
    setEditing({ ...EMPTY, ...professor, isNew: false });
  }

  async function onPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setEditing((prev) => ({ ...prev, photo: dataUrl }));
  }

  async function save(event) {
    event.preventDefault();
    setFormError("");
    const { isNew, prof_id, ...rest } = editing;
    try {
      if (isNew) {
        await api.post("/api/professors", { prof_id, ...rest });
      } else {
        await api.put(`/api/professors/${prof_id}`, rest);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function remove(profId) {
    if (!window.confirm(`Delete professor ${profId}?`)) return;
    await api.delete(`/api/professors/${profId}`);
    load();
  }

  function field(key, value) {
    setEditing((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Professors</h1>
        <button onClick={openCreate}>Add professor</button>
      </div>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Email</th>
            <th>Mobile</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {professors.map((professor) => (
            <tr key={professor.prof_id}>
              <td>
                {professor.photo ? (
                  <img className="photo-thumb" src={professor.photo} alt={professor.name} />
                ) : (
                  <span className="badge neutral">—</span>
                )}
              </td>
              <td>{professor.prof_id}</td>
              <td>{professor.name}</td>
              <td>{professor.department || "—"}</td>
              <td>{professor.email || "—"}</td>
              <td>{professor.mobile || "—"}</td>
              <td>
                <div className="row-actions">
                  <button className="ghost" onClick={() => openEdit(professor)}>
                    Edit
                  </button>
                  <button className="danger" onClick={() => remove(professor.prof_id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {professors.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No professors yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.isNew ? "Add professor" : `Edit ${editing.prof_id}`} onClose={() => setEditing(null)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label>Professor ID</label>
                <input
                  value={editing.prof_id}
                  onChange={(event) => field("prof_id", event.target.value)}
                  disabled={!editing.isNew}
                  required
                />
              </div>
              <div className="field">
                <label>Name</label>
                <input value={editing.name} onChange={(event) => field("name", event.target.value)} required />
              </div>
              <div className="field">
                <label>Department</label>
                <input value={editing.department} onChange={(event) => field("department", event.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input value={editing.email} onChange={(event) => field("email", event.target.value)} />
              </div>
              <div className="field">
                <label>Mobile</label>
                <input value={editing.mobile} onChange={(event) => field("mobile", event.target.value)} />
              </div>
              <div className="field">
                <label>Qualification</label>
                <input
                  value={editing.qualification}
                  onChange={(event) => field("qualification", event.target.value)}
                />
              </div>
            </div>
            <div className="field" style={{ marginTop: "1rem" }}>
              <label>Achievements</label>
              <textarea
                rows={2}
                value={editing.achievements || ""}
                onChange={(event) => field("achievements", event.target.value)}
              />
            </div>
            <div className="field" style={{ marginTop: "1rem" }}>
              <label>Photo</label>
              <input type="file" accept="image/*" onChange={onPhoto} />
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
